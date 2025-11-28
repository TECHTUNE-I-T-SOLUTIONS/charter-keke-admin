"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { MapPin, Navigation, Car, Clock, Loader2, ArrowRight, Users, GraduationCap } from "lucide-react"

const routes = [
  {
    id: "oke-odo-to-school",
    from: "Oke-Odo",
    to: "School Park (UNILORIN)",
    price: 700,
    duration: "15-20 min",
  },
  {
    id: "school-to-oke-odo",
    from: "School Park (UNILORIN)",
    to: "Oke-Odo",
    price: 700,
    duration: "15-20 min",
  },
]

function BookRideContent() {
  const { user } = useAuth()
  const [selectedRoute, setSelectedRoute] = useState("")
  const [passengers, setPassengers] = useState("1")
  const [isSearching, setIsSearching] = useState(false)

  const selectedRouteData = routes.find((r) => r.id === selectedRoute)

  const handleSearch = async () => {
    if (!selectedRoute) {
      toast.error("Please select a route")
      return
    }

    setIsSearching(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast.info("Searching for drivers...", {
      description: "We're connecting you with available drivers nearby.",
    })

    setIsSearching(false)

    toast.success("Feature coming soon!", {
      description: "Driver matching will be available once we launch.",
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">University of Ilorin</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Book a Ride</h1>
            <p className="text-muted-foreground mt-1">Select your route between campus and town</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Route Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle>Select Route</CardTitle>
                  <CardDescription>Choose your pickup and destination</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Route Options */}
                  <RadioGroup value={selectedRoute} onValueChange={setSelectedRoute} className="space-y-3">
                    {routes.map((route, index) => (
                      <motion.div
                        key={route.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <RadioGroupItem value={route.id} id={route.id} className="peer sr-only" />
                        <Label
                          htmlFor={route.id}
                          className="flex items-center justify-between p-4 rounded-xl border-2 border-muted bg-background/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:border-primary/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <MapPin className="h-4 w-4 text-primary" />
                              <div className="w-px h-4 bg-primary/30" />
                              <Navigation className="h-4 w-4 text-secondary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{route.from}</p>
                              <p className="text-xs text-muted-foreground">to</p>
                              <p className="font-medium text-foreground text-sm">{route.to}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">₦{route.price}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {route.duration}
                            </p>
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </RadioGroup>

                  {/* Passengers */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Number of Seats (kindly note that your number of seats will determine the type of vehicle you will be matched with)
                    </Label>
                        <RadioGroup value={passengers} onValueChange={setPassengers} className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 gap-2">
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                            <div key={num}>
                              <RadioGroupItem value={num} id={`passengers-${num}`} className="peer sr-only" />
                              <Label
                                htmlFor={`passengers-${num}`}
                                className="flex items-center justify-center w-14 h-14 rounded-xl border-2 border-muted bg-background/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:border-primary/50"
                              >
                                <span className="font-bold text-lg text-foreground">{num}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                  </div>

                  {/* Total Price */}
                  {selectedRouteData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">
                          ₦{selectedRouteData.price * Number.parseInt(passengers)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {passengers} seat(s) x ₦{selectedRouteData.price} per seat
                      </p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !selectedRoute}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 py-6 text-lg"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Finding Drivers...
                      </>
                    ) : (
                      <>
                        <Car className="h-5 w-5 mr-2" />
                        Find a Ride
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Route Preview / Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10 h-full min-h-[500px]">
                <CardContent className="p-0 h-full">
                  <div className="h-full rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center relative overflow-hidden">
                    {/* Animated route visualization */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border-2 border-dashed border-primary/20 rounded-full" />
                      <div className="absolute w-48 h-48 border-2 border-dashed border-secondary/20 rounded-full" />
                    </div>

                    <div className="text-center p-8 relative z-10">
                      {selectedRouteData ? (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={selectedRoute}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 rounded-2xl bg-primary/10">
                              <MapPin className="h-8 w-8 text-primary" />
                            </div>
                            <div className="font-bold text-lg">{selectedRouteData.from}</div>
                            <div className="flex flex-col items-center">
                              <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
                              <ArrowRight className="h-4 w-4 text-primary -rotate-270" />
                              <div className="w-1 h-8 bg-gradient-to-b from-secondary to-primary rounded-full" />
                            </div>
                            <div className="font-bold text-lg">{selectedRouteData.to}</div>
                            <div className="p-4 rounded-2xl bg-secondary/10">
                              <Navigation className="h-8 w-8 text-secondary" />
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                              Estimated time: {selectedRouteData.duration}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
                            <MapPin className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">Select a Route</h3>
                          <p className="text-sm text-muted-foreground max-w-xs">
                            Choose your pickup and destination to see the route preview
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BookRidePage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <BookRideContent />
    </ProtectedRoute>
  )
}
