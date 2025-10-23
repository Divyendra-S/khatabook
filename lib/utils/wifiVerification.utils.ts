import { supabase } from "@/lib/supabase/client";
import { getCurrentWiFiSSID, requestLocationPermissions } from "./wifi.utils";

export interface WiFiVerificationResult {
  currentSsid: string | null;
  isVerified: boolean;
  officeNetworks: string[];
  isRequired: boolean;
  error?: string;
}

/**
 * Perform WiFi verification for a user
 * This function checks if the user is connected to an allowed office network
 */
export async function performWiFiVerification(
  userId: string,
  organizationId: string
): Promise<WiFiVerificationResult> {
  try {
    // 1. Check if WiFi verification is required for this user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("wifi_verification_required")
      .eq("id", userId)
      .single();

    if (userError) {
      return {
        currentSsid: null,
        isVerified: false,
        officeNetworks: [],
        isRequired: false,
        error: "Failed to check WiFi requirements",
      };
    }

    const isRequired = userData?.wifi_verification_required || false;

    // 2. Request location permissions (required for WiFi SSID access)
    const permissionGranted = await requestLocationPermissions();
    
    if (!permissionGranted) {
      console.warn("Location permission not granted. Cannot verify WiFi.");
      // If permission not granted but verification is required, fail verification
      return {
        currentSsid: null,
        isVerified: !isRequired, // Pass if not required, fail if required
        officeNetworks: [],
        isRequired,
        error: "Location permission required to verify WiFi connection",
      };
    }

    // 3. Get current WiFi SSID
    const currentSsid = await getCurrentWiFiSSID();

    // 4. Fetch active office WiFi networks
    const { data: networks, error: networksError } = await supabase
      .from("office_wifi_networks")
      .select("ssid")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (networksError) {
      console.error("Failed to fetch office networks:", networksError);
      return {
        currentSsid,
        isVerified: !isRequired, // Pass if not required, fail if required
        officeNetworks: [],
        isRequired,
        error: "Failed to fetch office networks",
      };
    }

    const officeNetworks = networks?.map((n) => n.ssid) || [];

    // 5. Perform verification
    let isVerified = false;

    if (!isRequired) {
      // WiFi verification not required - always verified
      isVerified = true;
      console.log("WiFi verification not required. Passing verification.");
    } else if (!currentSsid) {
      // WiFi verification required but not connected
      isVerified = false;
      console.log("WiFi verification required but not connected to WiFi. Failing verification.");
    } else {
      // Check if current SSID matches any office network
      isVerified = officeNetworks.includes(currentSsid);
      console.log(`WiFi verification: Current SSID="${currentSsid}", Office Networks=[${officeNetworks.join(", ")}], Verified=${isVerified}`);
    }

    return {
      currentSsid,
      isVerified,
      officeNetworks,
      isRequired,
    };
  } catch (error) {
    console.error("WiFi verification error:", error);
    return {
      currentSsid: null,
      isVerified: false,
      officeNetworks: [],
      isRequired: false,
      error:
        error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}

/**
 * Get WiFi info for attendance records
 * Returns the SSID and verification status
 */
export function getWiFiInfoForAttendance(
  verificationResult: WiFiVerificationResult
): { ssid: string | null; verified: boolean } {
  return {
    ssid: verificationResult.currentSsid,
    verified: verificationResult.isVerified,
  };
}
