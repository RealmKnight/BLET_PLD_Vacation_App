import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { Feather } from "@expo/vector-icons";

// Make sure our interface accepts the pin_number type that comes from the database
interface Member {
  id: string | null;
  pin_number: string | number | null; // Accept both string and number since database might return either
  first_name: string | null;
  last_name: string | null;
  sdv_entitlement: number | null;
  division: string | null;
  wc_sen_roster: number | null;
  dwp_sen_roster: number | null;
  dmir_sen_roster: number | null;
  eje_sen_roster: number | null;
  status: string | null;
}

type SortOption = "alphabetical" | "wc" | "dwp" | "dmir" | "eje";

interface SDVEntitlementManagerProps {
  divisionId: string;
}

export function SDVEntitlementManager({ divisionId }: SDVEntitlementManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editedEntitlement, setEditedEntitlement] = useState<number>(0);
  const [sortOption, setSortOption] = useState<SortOption>("alphabetical");

  const { isDivisionAdmin, isUnionAdmin, isApplicationAdmin } = usePermissions();
  const canEdit = isDivisionAdmin() || isUnionAdmin() || isApplicationAdmin();

  useEffect(() => {
    loadMembers();
  }, [divisionId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      sortMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = members.filter(
        (member) =>
          member.first_name?.toLowerCase().includes(query) ||
          member.last_name?.toLowerCase().includes(query) ||
          String(member.pin_number).includes(query) // Convert pin_number to string for comparison
      );
      sortMembers(filtered);
    }
  }, [searchQuery, members, sortOption]);

  // Sort members based on current sort option
  function sortMembers(membersToSort: Member[]) {
    let sorted: Member[] = [];

    switch (sortOption) {
      case "wc":
        sorted = [...membersToSort].sort((a, b) => {
          // Sort nulls to the end
          if (a.wc_sen_roster === null) return 1;
          if (b.wc_sen_roster === null) return -1;
          return a.wc_sen_roster - b.wc_sen_roster;
        });
        break;
      case "dwp":
        sorted = [...membersToSort].sort((a, b) => {
          if (a.dwp_sen_roster === null) return 1;
          if (b.dwp_sen_roster === null) return -1;
          return a.dwp_sen_roster - b.dwp_sen_roster;
        });
        break;
      case "dmir":
        sorted = [...membersToSort].sort((a, b) => {
          if (a.dmir_sen_roster === null) return 1;
          if (b.dmir_sen_roster === null) return -1;
          return a.dmir_sen_roster - b.dmir_sen_roster;
        });
        break;
      case "eje":
        sorted = [...membersToSort].sort((a, b) => {
          if (a.eje_sen_roster === null) return 1;
          if (b.eje_sen_roster === null) return -1;
          return a.eje_sen_roster - b.eje_sen_roster;
        });
        break;
      case "alphabetical":
      default:
        sorted = [...membersToSort].sort((a, b) => {
          const lastNameA = (a.last_name || "").toLowerCase();
          const lastNameB = (b.last_name || "").toLowerCase();
          if (lastNameA < lastNameB) return -1;
          if (lastNameA > lastNameB) return 1;

          // If last names are the same, sort by first name
          const firstNameA = (a.first_name || "").toLowerCase();
          const firstNameB = (b.first_name || "").toLowerCase();
          if (firstNameA < firstNameB) return -1;
          if (firstNameA > firstNameB) return 1;
          return 0;
        });
    }

    setFilteredMembers(sorted);
  }

  async function loadMembers() {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("members")
        .select(
          "id, pin_number, first_name, last_name, sdv_entitlement, division, wc_sen_roster, dwp_sen_roster, dmir_sen_roster, eje_sen_roster, status"
        )
        .eq("division", divisionId)
        .eq("status", "ACTIVE")
        .order("last_name", { ascending: true });

      if (error) throw error;

      // Cast the data to ensure it matches our Member interface
      const allMembers = (data || []) as unknown as Member[];

      setMembers(allMembers);
      sortMembers(allMembers);
    } catch (err: any) {
      console.error("Error loading members:", err);
      setError(err.message || "Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to get a unique key for a member
  function getMemberKey(member: Member): string {
    if (member.pin_number) return String(member.pin_number);
    if (member.id) return member.id || "";
    return `${member.first_name || ""}_${member.last_name || ""}`;
  }

  function handleEditClick(member: Member) {
    const memberKey = getMemberKey(member);
    setEditingMemberId(memberKey);
    setEditedEntitlement(member.sdv_entitlement || 0);
  }

  function handleEntitlementChange(value: string) {
    const numValue = parseInt(value, 10);
    // Validate the input - SDV entitlement can be 0-12
    if (isNaN(numValue)) {
      setEditedEntitlement(0);
    } else {
      // Clamp the value between 0 and 12
      const clampedValue = Math.min(Math.max(numValue, 0), 12);
      setEditedEntitlement(clampedValue);
    }
  }

  function cancelEdit() {
    setEditingMemberId(null);
    setEditedEntitlement(0);
  }

  function handleSortChange(option: SortOption) {
    setSortOption(option);
    sortMembers(
      members.filter(
        (member) =>
          searchQuery.trim() === "" ||
          member.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(member.pin_number).includes(searchQuery)
      )
    );
  }

  async function saveChanges(member: Member) {
    if (!canEdit) {
      Alert.alert("Unauthorized", "You do not have permission to edit SDV entitlements.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Check if the value actually changed
      if (member.sdv_entitlement === editedEntitlement) {
        Alert.alert("No Changes", "No changes were made to the SDV entitlement.");
        setIsSaving(false);
        setEditingMemberId(null);
        return;
      }

      // Use pin_number for identifying members if available, otherwise use id
      let updateQuery = supabase.from("members").update({ sdv_entitlement: editedEntitlement });

      if (member.pin_number) {
        updateQuery = updateQuery.eq("pin_number", member.pin_number);
      } else if (member.id) {
        updateQuery = updateQuery.eq("id", member.id);
      } else {
        Alert.alert("Error", "Cannot identify member for update. Missing PIN or ID.");
        setIsSaving(false);
        return;
      }

      const { error } = await updateQuery;
      if (error) throw error;

      // Update the member in the local state
      const updatedMembers = members.map((m) => {
        if (getMemberKey(m) === getMemberKey(member)) {
          return { ...m, sdv_entitlement: editedEntitlement };
        }
        return m;
      });

      setMembers(updatedMembers);
      sortMembers(
        filteredMembers.map((m) => {
          if (getMemberKey(m) === getMemberKey(member)) {
            return { ...m, sdv_entitlement: editedEntitlement };
          }
          return m;
        })
      );

      Alert.alert("Success", "SDV entitlement updated successfully.");
      setEditingMemberId(null);
    } catch (err: any) {
      console.error("Error saving SDV entitlement:", err);
      setError(err.message || "Failed to save changes");
      Alert.alert("Error", "Failed to save SDV entitlement. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Member Name</Text>
          <Text style={styles.headerPin}>PIN</Text>
          <Text style={styles.headerEntitlement}>SDV</Text>
          {canEdit && <Text style={styles.headerActions}>Actions</Text>}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#BAC42A" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or PIN..."
              placeholderTextColor="#777777"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtonsScrollView}>
          <View style={styles.sortButtonsContainer}>
            <TouchableOpacity
              style={[styles.sortButton, sortOption === "alphabetical" && styles.sortButtonActive]}
              onPress={() => handleSortChange("alphabetical")}
            >
              <Text style={[styles.sortButtonText, sortOption === "alphabetical" && styles.sortButtonTextActive]}>
                Alphabetical
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortOption === "wc" && styles.sortButtonActive]}
              onPress={() => handleSortChange("wc")}
            >
              <Text style={[styles.sortButtonText, sortOption === "wc" && styles.sortButtonTextActive]}>WC</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortOption === "dmir" && styles.sortButtonActive]}
              onPress={() => handleSortChange("dmir")}
            >
              <Text style={[styles.sortButtonText, sortOption === "dmir" && styles.sortButtonTextActive]}>DMIR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortOption === "dwp" && styles.sortButtonActive]}
              onPress={() => handleSortChange("dwp")}
            >
              <Text style={[styles.sortButtonText, sortOption === "dwp" && styles.sortButtonTextActive]}>DWP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortOption === "eje" && styles.sortButtonActive]}
              onPress={() => handleSortChange("eje")}
            >
              <Text style={[styles.sortButtonText, sortOption === "eje" && styles.sortButtonTextActive]}>EJ&E</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  function renderMember({ item }: { item: Member }) {
    const memberKey = getMemberKey(item);
    const isEditing = editingMemberId === memberKey;

    // Get the roster number based on current sort option
    const getRosterDisplay = () => {
      if (sortOption === "alphabetical") return "";

      let rosterNumber = null;
      switch (sortOption) {
        case "wc":
          rosterNumber = item.wc_sen_roster;
          break;
        case "dwp":
          rosterNumber = item.dwp_sen_roster;
          break;
        case "dmir":
          rosterNumber = item.dmir_sen_roster;
          break;
        case "eje":
          rosterNumber = item.eje_sen_roster;
          break;
      }

      return rosterNumber !== null ? `(${rosterNumber})` : "";
    };

    return (
      <View style={styles.memberRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.memberName}>
            {item.last_name || ""}, {item.first_name || ""} {getRosterDisplay()}
          </Text>
        </View>

        <View style={styles.pinContainer}>
          <Text style={styles.pinText}>{item.pin_number !== null ? item.pin_number : "N/A"}</Text>
        </View>

        <View style={styles.entitlementContainer}>
          {isEditing ? (
            <TextInput
              style={styles.entitlementInput}
              keyboardType="numeric"
              value={editedEntitlement.toString()}
              onChangeText={handleEntitlementChange}
              maxLength={2}
              autoFocus
            />
          ) : (
            <Text style={styles.entitlementText}>{item.sdv_entitlement !== null ? item.sdv_entitlement : 0}</Text>
          )}
        </View>

        {canEdit && (
          <View style={styles.actionsContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton, isSaving && styles.disabledButton]}
                  onPress={cancelEdit}
                  disabled={isSaving}
                >
                  <Feather name="x" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton, isSaving && styles.disabledButton]}
                  onPress={() => saveChanges(item)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <Feather name="check" size={16} color="#000000" />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditClick(item)}
                disabled={!!editingMemberId}
              >
                <Feather name="edit-2" size={16} color={editingMemberId ? "#555555" : "#FFFFFF"} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BAC42A" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={24} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMembers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>SDV Entitlement Manager</Text>
        <Text style={styles.description}>
          Manage Single Day Vacation (SDV) entitlements for members in your division. Members can have a maximum of 12
          SDVs (6 per week split).
        </Text>
      </View>

      {renderHeader()}

      {filteredMembers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== ""
              ? "No members match your search criteria."
              : "No members found in this division."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item) => getMemberKey(item)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333333",
  },
  titleRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#BAC42A",
  },
  description: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerPin: {
    width: 80,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerEntitlement: {
    width: 60,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerActions: {
    width: 80,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    height: 40,
  },
  sortButtonsScrollView: {
    marginTop: 12,
  },
  sortButtonsContainer: {
    flexDirection: "row",
    paddingBottom: 8,
  },
  sortButton: {
    backgroundColor: "#1F1F1F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  sortButtonActive: {
    backgroundColor: "#BAC42A",
    borderColor: "#BAC42A",
  },
  sortButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: "#000000",
  },
  memberRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    alignItems: "center",
  },
  nameContainer: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  pinContainer: {
    width: 80,
    alignItems: "center",
  },
  pinText: {
    fontSize: 14,
    color: "#BAC42A",
    fontWeight: "500",
  },
  entitlementContainer: {
    width: 60,
    alignItems: "center",
  },
  entitlementText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  entitlementInput: {
    backgroundColor: "#1F1F1F",
    width: 50,
    height: 40,
    borderRadius: 6,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#333333",
  },
  actionsContainer: {
    flexDirection: "row",
    width: 80,
    justifyContent: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2D2D2D",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: "#BAC42A",
  },
  cancelButton: {
    backgroundColor: "#444444",
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  errorText: {
    color: "#EF4444",
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2D2D2D",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    paddingBottom: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    minHeight: 100,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
  },
});
