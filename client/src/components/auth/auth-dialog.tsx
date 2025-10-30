import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Check, ChevronRight } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Project imports
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { regionCoordinates } from "@/lib/philippines-coordinates";
import { loginSchema, type LoginUser, insertUserSchema, type InsertUser } from "@shared/schema";

// Import Philippine locations API service
import { 
  getRegions,
  getProvinces,
  getCitiesAndMunicipalities,
  getNCRCities,
  PSGCRegion,
  PSGCProvince,
  PSGCCity,
  PSGCMunicipality,
  DEFAULT_REGION
} from "@/lib/philippines-location-api";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function AuthDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  
  // Location selection state
  const [regions, setRegions] = useState<PSGCRegion[]>([]);
  const [provinces, setProvinces] = useState<PSGCProvince[]>([]);
  const [cities, setCities] = useState<(PSGCCity | PSGCMunicipality)[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [locationPath, setLocationPath] = useState<string>("Metro Manila");
  
  // Fetch regions on dialog open
  useEffect(() => {
    if (isOpen && activeTab === "signup") {
      loadRegions();
    }
  }, [isOpen, activeTab]);
  
  // Load regions from API
  const loadRegions = async () => {
    try {
      const regionsData = await getRegions();
      setRegions(regionsData);
      
      // Reset everything when loading regions
      setSelectedRegion(null);
      setSelectedProvince(null);
      setCities([]);  // Clear cities
      setProvinces([]); // Clear provinces
      setLocationPath("");
      signupForm.setValue("location", "");
    } catch (error) {
      console.error("Failed to load regions:", error);
    }
  };
  
  // Load provinces when region is selected
  const loadProvinces = async (regionCode: string) => {
    try {
      const provincesData = await getProvinces(regionCode);
      setProvinces(provincesData);
      
      // Reset province and city selection
      setSelectedProvince(null);
      setSelectedCity(null);
      setCities([]);
    } catch (error) {
      console.error("Failed to load provinces:", error);
    }
  };
  
  // Load cities when province is selected
  const loadCities = async (provinceCode: string) => {
    try {
      const citiesData = await getCitiesAndMunicipalities(provinceCode);
      setCities(citiesData);
      
      // Reset city selection
      setSelectedCity(null);
    } catch (error) {
      console.error("Failed to load cities:", error);
    }
  };
  
  // Handle region selection
  const handleRegionChange = async (code: string) => {
    try {
      // Find the selected region
      const region = regions.find(r => r.code === code);
      if (!region) return;
      
      // Update region selection state
      setSelectedRegion(code);
      setLocationPath(region.name);
      signupForm.setValue("location", region.name);
      
      // Clear previous selections
      setSelectedProvince(null);
      setCities([]);
      
      // Special handling for NCR (Metro Manila) - direct city selection
      if (code === '130000000' || region.name.includes('NCR') || region.name.includes('Capital')) {
        console.log('NCR selected, loading cities directly');
        // Load NCR cities directly
        const ncrCities = await getNCRCities();
        setCities(ncrCities);
        // No provinces for NCR
        setProvinces([]);
      } else {
        // For all other regions, load provinces
        const provincesData = await getProvinces(code);
        setProvinces(provincesData);
      }
    } catch (error) {
      console.error("Error in region selection:", error);
      // Reset on error
      setCities([]);
      setProvinces([]);
    }
  };
  
  // Handle province selection
  const handleProvinceChange = (code: string) => {
    const province = provinces.find(p => p.code === code);
    if (province) {
      setSelectedProvince(code);
      setLocationPath(`${province.name}, ${regions.find(r => r.code === province.regionCode)?.name || ''}`);
      signupForm.setValue("location", `${province.name}, ${regions.find(r => r.code === province.regionCode)?.name || ''}`);
      loadCities(code);
    }
  };
  
  // Handle city selection
  // Get auth context for updating user location
  const { updateUserLocation } = useAuth();

  const handleCityChange = (code: string) => {
    const city = cities.find(c => c.code === code);
    if (city) {
      setSelectedCity(code);
      
      // Find province and region names
      const province = provinces.find(p => p.code === city.provinceCode);
      const region = regions.find(r => r.code === city.regionCode);
      
      // Update location path
      const locationString = `${city.name}, ${province?.name || ''}, ${region?.name || ''}`;
      setLocationPath(locationString);
      signupForm.setValue("location", locationString);
      
      // Find coordinates for the selected location
      let coordinates: [number, number] | undefined;
      
      // Try to find coordinates by city name first
      if (regionCoordinates[city.name]) {
        coordinates = regionCoordinates[city.name];
      }
      // Then by province if we have it
      else if (province && regionCoordinates[province.name]) {
        coordinates = regionCoordinates[province.name];
      }
      // Finally by region
      else if (region && regionCoordinates[region.name]) {
        coordinates = regionCoordinates[region.name];
      }
      
      // Save user location for map localization
      updateUserLocation({
        city: city.name,
        province: province?.name,
        region: region?.name,
        coordinates
      });
    }
  };

  // Login form
  const [loginLoading, setLoginLoading] = useState(false);
  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Signup form with location
  const [signupLoading, setSignupLoading] = useState(false);
  const signupForm = useForm<InsertUser & { location: string }>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "user",
      location: "", // No default location - user must select
    },
  });

  // Login submit handler
  const onLoginSubmit = async (values: LoginUser) => {
    setLoginLoading(true);
    try {
      const response = await apiRequest(
        'POST', 
        '/api/auth/login', 
        values
      );
      
      // Parse the JSON response
      const data = await response.json();
      
      if (data && data.token) {
        login(data.token);
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to PanicSense PH",
        });
        setIsOpen(false);
        // Force page reload to ensure auth state is fresh
        window.location.reload();
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // Signup submit handler
  const onSignupSubmit = async (values: InsertUser & { location: string }) => {
    if (!termsAccepted) {
      toast({
        title: "Terms and Conditions",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }

    setSignupLoading(true);
    try {
      // Extract location from values, but don't send it to the API
      const { location, ...userValues } = values;
      
      // Save user's location information for map focusing
      if (selectedRegion && selectedProvince && selectedCity) {
        // Get coordinates for the selected location
        let coordinates: [number, number] | undefined;
        
        // Try to get coordinates for the city first
        const cityKey = `${selectedCity}, ${selectedProvince}`;
        if (regionCoordinates[cityKey]) {
          coordinates = regionCoordinates[cityKey];
        } 
        // Then try province
        else if (regionCoordinates[selectedProvince]) {
          coordinates = regionCoordinates[selectedProvince];
        } 
        // Finally fall back to region
        else if (regionCoordinates[selectedRegion]) {
          coordinates = regionCoordinates[selectedRegion];
        }
        
        // If we found coordinates, save the location data
        if (coordinates) {
          const locationData = {
            region: selectedRegion,
            province: selectedProvince,
            city: selectedCity,
            coordinates
          };
          
          // Save to localStorage
          localStorage.setItem('user_location', JSON.stringify(locationData));
          
          console.log("✅ Saved user location during signup:", locationData);
        }
      }
      
      // Call API without the location field
      const response = await apiRequest('POST', '/api/auth/signup', userValues);
      
      // Check if response is successful
      if (response.ok) {
        toast({
          title: "Account created successfully!",
          description: "Please sign in with your new account",
        });
        setActiveTab("login");
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-transparent">
        <div className="flex flex-col md:flex-row w-full">
          {/* Left panel with hero image and branding - visible on medium screens and up */}
          <div className="hidden md:block md:w-5/12 bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 p-8 rounded-l-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent"></div>
            
            {/* Animated floating elements */}
            <div className="absolute top-1/4 left-1/3 h-2 w-2 rounded-full bg-blue-400 shadow-glow-blue opacity-75 animate-float-1"></div>
            <div className="absolute top-1/2 right-1/4 h-3 w-3 rounded-full bg-indigo-400 shadow-glow-indigo opacity-75 animate-float-2"></div>
            <div className="absolute bottom-1/4 left-1/4 h-2 w-2 rounded-full bg-purple-400 shadow-glow-purple opacity-75 animate-float-3"></div>
            
            {/* Logo and Branding */}
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <img 
                    src="/favicon.png" 
                    alt="PanicSense Logo" 
                    className="h-12 w-12 mr-3"
                  />
                  <h1 className="text-3xl font-bold text-white">PanicSense PH</h1>
                </div>
                <p className="text-blue-100 text-lg leading-relaxed">
                  Advanced disaster monitoring and sentiment analysis for crisis response
                </p>
                <p className="text-blue-100 text-base mt-4">
                  Join our community to help monitor and respond to emergencies across the Philippines.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right panel with auth forms */}
          <div className="w-full md:w-7/12 bg-white rounded-r-2xl rounded-l-2xl md:rounded-l-none">
            {/* Title visible only on mobile */}
            <div className="md:hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 rounded-t-2xl">
              <div className="flex items-center justify-center">
                <img 
                  src="/favicon.png" 
                  alt="PanicSense Logo" 
                  className="h-8 w-8 mr-2"
                />
                <h1 className="text-xl font-bold text-white text-center">PanicSense PH</h1>
              </div>
            </div>
            
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-8 pt-6">
                <DialogTitle className="sr-only">Authentication</DialogTitle>
                <DialogDescription className="sr-only">
                  Login or sign up for a PanicSense account
                </DialogDescription>
                <TabsList className="grid grid-cols-2 w-full bg-gray-100 rounded-lg p-1">
                  <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Login Tab */}
              <TabsContent value="login" className="p-0 mt-4">
                <div className="px-8 pb-6">
                  <div className="space-y-1 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                    <p className="text-gray-500">
                      Sign in to your PanicSense account
                    </p>
                  </div>
                  
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <motion.div
                        variants={fadeIn}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        <Input
                          {...loginForm.register("username")}
                          placeholder="Username"
                          type="text"
                          autoComplete="username"
                          className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </motion.div>

                      <motion.div
                        variants={fadeIn}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                      >
                        <Input
                          {...loginForm.register("password")}
                          placeholder="Password"
                          type="password"
                          autoComplete="current-password"
                          className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </motion.div>

                      <motion.div
                        variants={fadeIn}
                        transition={{ delay: 0.3 }}
                        className="pt-2"
                      >
                        <Button
                          type="submit"
                          className="w-full h-12 font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl"
                          disabled={loginLoading}
                        >
                          {loginLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            "Sign in"
                          )}
                        </Button>
                      </motion.div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mt-3">
                          Don't have an account?{" "}
                          <button
                            type="button"
                            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={() => setActiveTab("signup")}
                          >
                            Sign up
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="p-0 mt-4">
                <div className="px-8 pb-6 max-h-[500px] overflow-y-auto">
                  <div className="space-y-1 mb-5">
                    <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
                    <p className="text-gray-500">
                      Join the PanicSense community
                    </p>
                  </div>
                  
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Input
                            {...signupForm.register("fullName")}
                            placeholder="Full Name"
                            type="text"
                            className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                          />
                          {signupForm.formState.errors.fullName && (
                            <p className="text-sm text-red-500">
                              {signupForm.formState.errors.fullName.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Input
                            {...signupForm.register("username")}
                            placeholder="Username"
                            type="text"
                            className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                          />
                          {signupForm.formState.errors.username && (
                            <p className="text-sm text-red-500">
                              {signupForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Input
                          {...signupForm.register("email")}
                          placeholder="Email"
                          type="email"
                          className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                        />
                        {signupForm.formState.errors.email && (
                          <p className="text-sm text-red-500">
                            {signupForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Location
                        </label>
                        
                        <div className="space-y-3">
                          {/* Current selection path */}
                          <div className="text-sm text-blue-600 mb-2 flex items-center">
                            <span className="font-medium">Selected:</span>
                            <span className="ml-2">{locationPath}</span>
                          </div>
                          
                          {/* Region selection */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Region
                            </label>
                            <Select
                              value={selectedRegion || undefined}
                              onValueChange={handleRegionChange}
                            >
                              <SelectTrigger className="h-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all">
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {regions.map((region) => (
                                  <SelectItem key={region.code} value={region.code}>
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Province selection - visible when region is selected and not NCR */}
                          {selectedRegion && provinces.length > 0 && (
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                Province
                              </label>
                              <Select
                                value={selectedProvince || undefined}
                                onValueChange={handleProvinceChange}
                              >
                                <SelectTrigger className="h-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all">
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {provinces.map((province) => (
                                    <SelectItem key={province.code} value={province.code}>
                                      {province.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {/* City/Municipality selection - always show when cities are available */}
                          {cities.length > 0 && (
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                City/Municipality
                              </label>
                              <Select
                                value={selectedCity || undefined}
                                onValueChange={handleCityChange}
                              >
                                <SelectTrigger className="h-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all">
                                  <SelectValue placeholder="Select city/municipality" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {cities.map((city) => (
                                    <SelectItem key={city.code} value={city.code}>
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Input
                            {...signupForm.register("password")}
                            placeholder="Password"
                            type="password"
                            className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                          />
                          {signupForm.formState.errors.password && (
                            <p className="text-sm text-red-500">
                              {signupForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Input
                            {...signupForm.register("confirmPassword")}
                            placeholder="Confirm Password"
                            type="password"
                            className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                          />
                          {signupForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-red-500">
                              {signupForm.formState.errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 mt-2 p-4 bg-gray-50 rounded-lg">
                        <Checkbox 
                          id="terms" 
                          checked={termsAccepted}
                          onCheckedChange={(checked) => {
                            setTermsAccepted(checked as boolean);
                          }}
                          className="mt-1"
                        />
                        <div>
                          <label
                            htmlFor="terms"
                            className="text-sm font-medium text-gray-700"
                          >
                            I agree to the Terms and Conditions
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            By creating an account, you agree to the PanicSense Terms of Service and Privacy Policy.
                            Your data will be securely stored and used only for disaster management purposes.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl"
                        disabled={signupLoading}
                      >
                        {signupLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mt-1">
                          Already have an account?{" "}
                          <button
                            type="button"
                            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={() => setActiveTab("login")}
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}