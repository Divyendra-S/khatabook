import { useAuth } from "@/hooks/auth/useAuth";
import {
  useAddWiFiNetwork,
  useDeleteWiFiNetwork,
  useUpdateWiFiNetwork,
} from "@/hooks/mutations/useWiFiMutations";
import { useAllWiFiNetworks } from "@/hooks/queries/useWiFi";
import { OfficeWiFiNetwork } from "@/lib/types";
import { getAvailableWiFiNetworks } from "@/lib/utils/wifi.utils";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function WiFiNetworksScreen() {
  const { user } = useAuth();
  const organizationId = user?.organization_id || "";

  // Fetch all WiFi networks
  const { data: networks, isLoading } = useAllWiFiNetworks(organizationId, {
    enabled: !!organizationId,
  });

  // Mutations
  const addMutation = useAddWiFiNetwork(organizationId);
  const updateMutation = useUpdateWiFiNetwork(organizationId);
  const deleteMutation = useDeleteWiFiNetwork(organizationId);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [ssid, setSsid] = useState("");
  const [description, setDescription] = useState("");
  const [availableNetworks, setAvailableNetworks] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleScanNetworks = async () => {
    setIsScanning(true);
    try {
      const networks = await getAvailableWiFiNetworks();
      setAvailableNetworks(networks);
      setShowSuggestions(true);
      
      if (networks.length === 0) {
        Alert.alert(
          "No Networks Found",
          "Make sure you're connected to a WiFi network and location permissions are granted."
        );
      }
    } catch (error) {
      Alert.alert(
        "Scan Failed",
        "Could not scan for WiFi networks. You can still type the network name manually."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectNetwork = (networkSsid: string) => {
    setSsid(networkSsid);
    setShowSuggestions(false);
  };

  const handleAddNetwork = async () => {
    if (!ssid.trim()) {
      Alert.alert("Error", "Please enter a WiFi network name (SSID)");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not found");
      return;
    }

    try {
      await addMutation.mutateAsync({
        ssid: ssid.trim(),
        description: description.trim() || undefined,
        createdBy: user.id,
      });

      Alert.alert("Success", "WiFi network added successfully");
      setSsid("");
      setDescription("");
      setAvailableNetworks([]);
      setShowSuggestions(false);
      setShowAddForm(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add WiFi network"
      );
    }
  };

  const handleToggleActive = async (network: OfficeWiFiNetwork) => {
    try {
      await updateMutation.mutateAsync({
        networkId: network.id,
        updates: { is_active: !network.is_active },
      });

      Alert.alert(
        "Success",
        `WiFi network ${network.is_active ? "deactivated" : "activated"}`
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update WiFi network"
      );
    }
  };

  const handleDeleteNetwork = (network: OfficeWiFiNetwork) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the WiFi network "${network.ssid}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ networkId: network.id });
              Alert.alert("Success", "WiFi network deleted successfully");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete WiFi network"
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading WiFi networks...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Office WiFi Networks</Text>
        <Text style={styles.subtitle}>
          Configure allowed WiFi networks for attendance verification
        </Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Add your office WiFi network names (SSIDs) here. Employees will need
            to be connected to one of these networks to check in/out when WiFi
            verification is enabled for them.
          </Text>
          <Text style={styles.infoNote}>
            Note: Only the network name is checked, not the password.
          </Text>
        </View>
      </View>

      {/* Add Network Button */}
      {!showAddForm && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add WiFi Network</Text>
        </TouchableOpacity>
      )}

      {/* Add Network Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Add New WiFi Network</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Ionicons name="close-circle" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                WiFi Network Name (SSID) <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanNetworks}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="scan" size={16} color="#007AFF" />
                    <Text style={styles.scanButtonText}>Scan Networks</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={ssid}
              onChangeText={setSsid}
              placeholder="e.g., Office-WiFi, CompanyHQ"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              This is the name that appears when you connect to WiFi
            </Text>

            {/* Available Networks Suggestions */}
            {showSuggestions && availableNetworks.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>
                  Available Network{availableNetworks.length > 1 ? 's' : ''}:
                </Text>
                {availableNetworks.map((network, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectNetwork(network)}
                  >
                    <Ionicons name="wifi" size={20} color="#10b981" />
                    <Text style={styles.suggestionText}>{network}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Main office 2nd floor"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddForm(false);
                setSsid("");
                setDescription("");
                setAvailableNetworks([]);
                setShowSuggestions(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                addMutation.isPending && styles.saveButtonDisabled,
              ]}
              onPress={handleAddNetwork}
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Add Network</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Networks List */}
      <View style={styles.networksList}>
        <Text style={styles.listTitle}>
          Configured Networks ({networks?.length || 0})
        </Text>

        {!networks || networks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wifi-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              No WiFi networks configured
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first office WiFi network to get started
            </Text>
          </View>
        ) : (
          networks.map((network) => (
            <View
              key={network.id}
              style={[
                styles.networkCard,
                !network.is_active && styles.networkCardInactive,
              ]}
            >
              <View style={styles.networkCardHeader}>
                <View style={styles.networkInfo}>
                  <View style={styles.networkTitleRow}>
                    <Ionicons
                      name={network.is_active ? "wifi" : "wifi-outline"}
                      size={20}
                      color={network.is_active ? "#10b981" : "#6b7280"}
                    />
                    <Text
                      style={[
                        styles.networkSsid,
                        !network.is_active && styles.networkSsidInactive,
                      ]}
                    >
                      {network.ssid}
                    </Text>
                  </View>
                  {network.description && (
                    <Text style={styles.networkDescription}>
                      {network.description}
                    </Text>
                  )}
                  <Text style={styles.networkMeta}>
                    Added {new Date(network.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.networkActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleToggleActive(network)}
                    disabled={updateMutation.isPending}
                  >
                    <Ionicons
                      name={network.is_active ? "toggle" : "toggle-outline"}
                      size={32}
                      color={network.is_active ? "#10b981" : "#6b7280"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteNetwork(network)}
                    disabled={deleteMutation.isPending}
                  >
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  network.is_active
                    ? styles.statusBadgeActive
                    : styles.statusBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    network.is_active
                      ? styles.statusBadgeTextActive
                      : styles.statusBadgeTextInactive,
                  ]}
                >
                  {network.is_active ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <View style={styles.helpItem}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Text style={styles.helpText}>
            To find your WiFi network name, check your WiFi settings on your
            device
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
          <Text style={styles.helpText}>
            Only HR users can manage WiFi networks
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Ionicons name="people-outline" size={20} color="#666" />
          <Text style={styles.helpText}>
            Enable WiFi verification per employee in their profile settings
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
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
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
    marginBottom: 8,
  },
  infoNote: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addForm: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  scanButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007AFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 8,
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1f2937",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  networksList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },
  networkCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  networkCardInactive: {
    opacity: 0.7,
  },
  networkCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  networkInfo: {
    flex: 1,
  },
  networkTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  networkSsid: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  networkSsidInactive: {
    color: "#6b7280",
  },
  networkDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  networkMeta: {
    fontSize: 12,
    color: "#9ca3af",
  },
  networkActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusBadgeActive: {
    backgroundColor: "#d1fae5",
  },
  statusBadgeInactive: {
    backgroundColor: "#f3f4f6",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadgeTextActive: {
    color: "#065f46",
  },
  statusBadgeTextInactive: {
    color: "#6b7280",
  },
  helpSection: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});

