"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // User State
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  
  // Local phone number without country code for display
  const [localPhoneNumber, setLocalPhoneNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [profileUpdated, setProfileUpdated] = useState(false);

  // Fetch profile data from API
  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) return;

      setLoading(true);
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to fetch profile data");

        const data = await res.json();
        // Extract local number from full phone number (remove 44 prefix if present)
        const fullPhone = data.phoneNumber || "";
        const localNumber = fullPhone.startsWith('44') ? fullPhone.slice(2) : fullPhone;
        
        setUser({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phoneNumber: fullPhone,
        });
        
        setLocalPhoneNumber(localNumber);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session]);

  // Phone number validation function (for local 10-digit number)
  const validatePhoneNumber = (localPhone: string): string => {
    // Remove all non-numeric characters
    const cleaned = localPhone.replace(/\D/g, '');
    
    // Check if it matches the required format: 10 digits for UK local number
    if (cleaned.length === 0) return "";
    if (cleaned.length !== 10) return "Phone number must be exactly 10 digits";
    if (!cleaned.startsWith('7') && !cleaned.startsWith('1') && !cleaned.startsWith('2')) {
      return "UK phone numbers typically start with 1, 2, or 7";
    }
    
    return ""; // No error
  };

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'localPhoneNumber') {
      // Only allow numbers for local phone number
      const numbersOnly = value.replace(/\D/g, '');
      const error = validatePhoneNumber(numbersOnly);
      setPhoneError(error);
      setLocalPhoneNumber(numbersOnly);
      
      // Update the full phone number with 44 prefix
      const fullPhoneNumber = numbersOnly ? `44${numbersOnly}` : "";
      setUser({ ...user, phoneNumber: fullPhoneNumber });
    } else {
      setUser({ ...user, [name]: value });
    }
  };

  // Handle Profile Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submission
    const phoneValidationError = validatePhoneNumber(localPhoneNumber);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }
    
    setUpdating(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        if (res.status === 409 && errorData.error?.includes("Phone number is already in use")) {
          setPhoneError("This phone number is already in use by another user");
          return;
        }
        
        throw new Error(errorData.error || "Failed to update profile");
      }

      setProfileUpdated(true);
      setPhoneError(""); // Clear any phone errors on success
      
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  // Show loading state
  if (loading) return <p className="text-center text-black">Loading profile...</p>;

  // Show success state
  if (profileUpdated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
        <div className="w-full max-w-lg text-center">
          <div className="mb-6 sm:mb-8">
            <div className="text-[#25d366] text-5xl sm:text-6xl mb-4">✓</div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-3 sm:mb-4 leading-tight">
              profile updated successfully
            </h1>
          </div>
          <button
            onClick={() => router.push("/daily-reminder")}
            className="bg-[#25d366] text-white font-semibold text-base sm:text-lg px-8 py-4 rounded-md shadow hover:bg-[#128C7E] transition-colors w-full max-w-xs sm:w-auto sm:px-8 mx-auto"
          >
            set your first reminder
          </button>
        </div>
      </div>
    );
  }

  // Get redirect message
  const message = searchParams.get("message");
  const from = searchParams.get("from");

  return (
    <div className="min-h-screen flex flex-col items-center mx-auto justify-center px-4 sm:px-6 md:px-8 lg:px-16 pt-20 sm:pt-24 md:pt-28 pb-8">
      <div className="w-full max-w-2xl">
        {message === "phone-required" && from === "reminders" && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border-l-4 border-[#25d366] rounded-r-md">
            <p className="text-gray-800 font-medium text-sm sm:text-base">
              📱 phone number required to access your dashboard
            </p>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              we need your phone number to send WhatsApp reminders
            </p>
          </div>
        )}
        
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 leading-tight">
            complete your profile
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6 max-w-xl leading-relaxed">
            {(!user.firstName || !user.lastName || !localPhoneNumber) 
              ? "just a few details to get your daily reminders started"
              : "manage your profile information"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">first name</label>
              <input
                type="text"
                name="firstName"
                value={user.firstName}
                onChange={handleChange}
                className={`w-full p-3 sm:p-4 border-2 rounded-md text-black bg-white text-base sm:text-lg ${!user.firstName ? 'border-[#25d366] animate-pulse' : 'border-gray-300 focus:border-[#25d366]'} focus:outline-none transition-colors`}
                placeholder="enter your first name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">last name</label>
              <input
                type="text"
                name="lastName"
                value={user.lastName}
                onChange={handleChange}
                className={`w-full p-3 sm:p-4 border-2 rounded-md text-black bg-white text-base sm:text-lg ${!user.lastName ? 'border-[#25d366] animate-pulse' : 'border-gray-300 focus:border-[#25d366]'} focus:outline-none transition-colors`}
                placeholder="enter your last name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">e-mail</label>
            <input
              type="email"
              name="email"
              value={user.email}
              className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-md bg-gray-50 text-black text-base sm:text-lg"
              disabled
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">e-mail cannot be changed</p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">whatsapp number</label>
            <div className="relative flex">
              <div className="flex items-center px-3 sm:px-4 border-2 border-r-0 rounded-l-md bg-gray-100 text-gray-600 text-base sm:text-lg font-medium">
                +44
              </div>
              <input
                type="tel"
                name="localPhoneNumber"
                value={localPhoneNumber}
                onChange={handleChange}
                className={`flex-1 p-3 sm:p-4 border-2 border-l-0 rounded-r-md text-black bg-white text-base sm:text-lg focus:outline-none transition-colors ${
                  phoneError 
                    ? 'border-red-500 focus:border-red-500' 
                    : !localPhoneNumber 
                      ? 'border-[#25d366] animate-pulse' 
                      : 'border-gray-300 focus:border-[#25d366]'
                }`}
                placeholder="1234567890"
                maxLength={10}
                required
              />
              {localPhoneNumber && !phoneError && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#25d366]">
                  ✓
                </div>
              )}
            </div>
            {phoneError ? (
              <p className="text-xs sm:text-sm text-red-600 mt-1 font-medium">
                {phoneError}
              </p>
            ) : (
              <div className="text-xs sm:text-sm text-gray-500 mt-1 space-y-1">
                <p>enter your 10-digit UK phone number</p>
                <p>we will use this to send your daily reminders</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-[#25d366] text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-md shadow hover:bg-[#128C7E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={updating || !!phoneError || !localPhoneNumber}
          >
            {updating ? "updating profile..." : "save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-center text-black mt-28">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}