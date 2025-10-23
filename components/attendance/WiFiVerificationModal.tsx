import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface WiFiVerificationResult {
  currentSsid: string | null;
  isVerified: boolean;
  officeNetworks: string[];
  isRequired: boolean;
}

interface WiFiVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  verificationResult: WiFiVerificationResult;
  action: "check-in" | "check-out";
}

export default function WiFiVerificationModal({
  visible,
  onClose,
  verificationResult,
  action,
}: WiFiVerificationModalProps) {
  const { currentSsid, isVerified, officeNetworks, isRequired } =
    verificationResult;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                isVerified ? styles.iconSuccess : styles.iconWarning,
              ]}
            >
              <Ionicons
                name={isVerified ? "checkmark-circle" : "alert-circle"}
                size={48}
                color="#fff"
              />
            </View>
            <Text style={styles.title}>WiFi Verification</Text>
            <Text style={styles.subtitle}>
              {action === "check-in" ? "Check-In" : "Check-Out"} Attempt
            </Text>
          </View>

          <ScrollView style={styles.content}>
            {/* Current Connection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Current Connection</Text>
              <View
                style={[
                  styles.infoCard,
                  currentSsid
                    ? styles.infoCardConnected
                    : styles.infoCardNotConnected,
                ]}
              >
                <Ionicons
                  name={currentSsid ? "wifi" : "wifi-outline"}
                  size={24}
                  color={currentSsid ? "#10b981" : "#6b7280"}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>WiFi Network</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      !currentSsid && styles.infoValueDisabled,
                    ]}
                  >
                    {currentSsid || "Not connected to WiFi"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Office Networks */}
            {isRequired && officeNetworks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Allowed Office Networks ({officeNetworks.length})
                </Text>
                {officeNetworks.map((network, index) => {
                  const isMatch = network === currentSsid;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.networkCard,
                        isMatch && styles.networkCardMatch,
                      ]}
                    >
                      <Ionicons
                        name={isMatch ? "checkmark-circle" : "wifi"}
                        size={20}
                        color={isMatch ? "#10b981" : "#6b7280"}
                      />
                      <Text
                        style={[
                          styles.networkName,
                          isMatch && styles.networkNameMatch,
                        ]}
                      >
                        {network}
                      </Text>
                      {isMatch && (
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchBadgeText}>MATCHED</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Verification Result */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification Result</Text>
              <View
                style={[
                  styles.resultCard,
                  isVerified
                    ? styles.resultCardSuccess
                    : styles.resultCardError,
                ]}
              >
                <Ionicons
                  name={
                    isVerified
                      ? "checkmark-circle-outline"
                      : "close-circle-outline"
                  }
                  size={32}
                  color={isVerified ? "#10b981" : "#ef4444"}
                />
                <View style={styles.resultTextContainer}>
                  <Text
                    style={[
                      styles.resultTitle,
                      isVerified
                        ? styles.resultTitleSuccess
                        : styles.resultTitleError,
                    ]}
                  >
                    {isVerified ? "Verification Passed" : "Verification Failed"}
                  </Text>
                  <Text style={styles.resultMessage}>
                    {isVerified
                      ? `You are connected to an authorized office network. ${
                          action === "check-in" ? "Check-in" : "Check-out"
                        } successful.`
                      : isRequired
                      ? `You must be connected to one of the office WiFi networks to ${
                          action === "check-in" ? "check in" : "check out"
                        }.`
                      : "WiFi verification is not required for your account."}
                  </Text>
                </View>
              </View>
            </View>

            {/* Help Section */}
            {!isVerified && isRequired && (
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>What should I do?</Text>
                <View style={styles.helpItem}>
                  <Text style={styles.helpNumber}>1.</Text>
                  <Text style={styles.helpText}>
                    Make sure you're connected to office WiFi
                  </Text>
                </View>
                <View style={styles.helpItem}>
                  <Text style={styles.helpNumber}>2.</Text>
                  <Text style={styles.helpText}>
                    Check if your WiFi network name matches one of the allowed
                    networks above
                  </Text>
                </View>
                <View style={styles.helpItem}>
                  <Text style={styles.helpNumber}>3.</Text>
                  <Text style={styles.helpText}>
                    If you're at the office but verification fails, contact HR
                  </Text>
                </View>
              </View>
            )}

            {/* Info Note */}
            {!isRequired && (
              <View style={styles.infoNote}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#3b82f6"
                />
                <Text style={styles.infoNoteText}>
                  WiFi verification is not enabled for your account. You can{" "}
                  {action === "check-in" ? "check in" : "check out"} from
                  anywhere.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>
              {isVerified ? "Continue" : "Got it"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconSuccess: {
    backgroundColor: "#10b981",
  },
  iconWarning: {
    backgroundColor: "#f59e0b",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  infoCardConnected: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  infoCardNotConnected: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  infoValueDisabled: {
    color: "#9ca3af",
  },
  networkCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
    gap: 8,
  },
  networkCardMatch: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  networkName: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  networkNameMatch: {
    color: "#065f46",
    fontWeight: "600",
  },
  matchBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  matchBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  resultCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  resultCardSuccess: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  resultCardError: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  resultTitleSuccess: {
    color: "#065f46",
  },
  resultTitleError: {
    color: "#991b1b",
  },
  resultMessage: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  helpSection: {
    backgroundColor: "#fffbeb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fcd34d",
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  helpNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
    width: 20,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: "#78350f",
    lineHeight: 20,
  },
  infoNote: {
    flexDirection: "row",
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    alignItems: "flex-start",
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    alignItems: "center",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
