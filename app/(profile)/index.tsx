import React, { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView, useWindowDimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { useAuth } from "@/contexts/AuthContext";
import { AuthHeader } from "@/components/AuthHeader";
import { updateProfile, updateUserPhone } from "@/services/auth";
import { Database } from "@/types/supabase";
import { AppHeader } from "@/components/AppHeader";

type Zone = Database["public"]["Enums"]["zone"];
type Division = Database["public"]["Enums"]["division"];
type Role = Database["public"]["Enums"]["role"];

export default function ProfileScreen() {
  const router = useRouter();
  const { member, user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Add debugging logs
  console.log("Profile Data:", {
    user: user
      ? {
          id: user.id,
          email: user.email,
          phone: user.phone,
        }
      : null,
    member: member
      ? {
          first_name: member.first_name,
          last_name: member.last_name,
          pin_number: member.pin_number,
        }
      : null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(member?.first_name || "");
  const [lastName, setLastName] = useState(member?.last_name || "");
  const [pinNumber, setPinNumber] = useState(member?.pin_number?.toString() || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(member?.date_of_birth || "");
  const [companyHireDate, setCompanyHireDate] = useState(member?.company_hire_date || "");
  const [engineerDate, setEngineerDate] = useState(member?.engineer_date || "");
  const [division, setDivision] = useState<Division | null>(member?.division || null);
  const [zone, setZone] = useState<Zone | null>(member?.zone || null);

  const isAdmin = member?.role !== "user";

  // Add useEffect to update form state when user/member data changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setPhoneNumber(user.phone || "");
    }
    if (member) {
      setFirstName(member.first_name || "");
      setLastName(member.last_name || "");
      setPinNumber(member.pin_number?.toString() || "");
      setDateOfBirth(member.date_of_birth || "");
      setCompanyHireDate(member.company_hire_date || "");
      setEngineerDate(member.engineer_date || "");
      setDivision(member.division || null);
      setZone(member.zone || null);
    }
  }, [user, member]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update user phone number
      if (phoneNumber !== user?.phone) {
        await updateUserPhone(phoneNumber);
      }

      // Only update member profile if user is an admin
      if (isAdmin) {
        await updateProfile({
          first_name: firstName,
          last_name: lastName,
          pin_number: parseInt(pinNumber, 10),
          company_hire_date: companyHireDate,
          engineer_date: engineerDate,
          division: division,
          zone: zone,
          date_of_birth: dateOfBirth,
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFirstName(member?.first_name || "");
    setLastName(member?.last_name || "");
    setPinNumber(member?.pin_number?.toString() || "");
    setEmail(user?.email || "");
    setPhoneNumber(user?.phone || "");
    setDateOfBirth(member?.date_of_birth || "");
    setCompanyHireDate(member?.company_hire_date || "");
    setEngineerDate(member?.engineer_date || "");
    setDivision(member?.division || null);
    setZone(member?.zone || null);
    setIsEditing(false);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={[styles.container, { backgroundColor: "#000000" }]}>
        <AppHeader
          showBackButton
          showAdminButton={false}
          showLogoutButton={false}
          customRightButtons={
            isEditing ? (
              <>
                <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                  <Ionicons name="close-outline" size={24} color="#BAC42A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                  <Ionicons name="checkmark-outline" size={24} color="#BAC42A" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerButton}>
                <Ionicons name="pencil-outline" size={24} color="#BAC42A" />
              </TouchableOpacity>
            )
          }
        />
        <ScrollView
          style={[styles.scrollView, { backgroundColor: "#000000" }]}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: "#000000" }]}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={[styles.content, isMobile && styles.contentMobile, { backgroundColor: "#000000" }]}>
            <View style={[styles.headerContainer, { backgroundColor: "#000000" }]}>
              <View style={[styles.header, { backgroundColor: "#000000" }]}>
                <AuthHeader />
              </View>
            </View>

            <ThemedView style={[styles.profileContainer, { backgroundColor: "#000000" }]}>
              <ThemedText type="title" style={styles.title}>
                Profile Information
              </ThemedText>

              {!isAdmin && (
                <ThemedView style={styles.infoNote}>
                  <ThemedText style={styles.infoText}>
                    You can only update your phone number from this page. If any other information is incorrect, please
                    contact your Division Admin to make the necessary changes.
                  </ThemedText>
                </ThemedView>
              )}

              {error && <ThemedText style={styles.error}>{error}</ThemedText>}

              <View style={styles.form}>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>First Name</ThemedText>
                  <ThemedTextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={isEditing && isAdmin}
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Last Name</ThemedText>
                  <ThemedTextInput
                    value={lastName}
                    onChangeText={setLastName}
                    editable={isEditing && isAdmin}
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>PIN Number</ThemedText>
                  <ThemedTextInput
                    value={pinNumber}
                    onChangeText={setPinNumber}
                    editable={isEditing && isAdmin}
                    keyboardType="numeric"
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Email</ThemedText>
                  <ThemedTextInput
                    value={email}
                    onChangeText={setEmail}
                    editable={false}
                    style={[styles.input, styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Phone Number</ThemedText>
                  <ThemedTextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    editable={isEditing}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Date of Birth</ThemedText>
                  <ThemedTextInput
                    value={dateOfBirth}
                    onChangeText={(text) => {
                      // Format the date as YYYY-MM-DD
                      const formattedDate = text.replace(/\D/g, "").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
                      setDateOfBirth(formattedDate);
                    }}
                    editable={isEditing && isAdmin}
                    placeholder="YYYY-MM-DD"
                    keyboardType="numeric"
                    maxLength={10}
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Company Hire Date</ThemedText>
                  <ThemedTextInput
                    value={companyHireDate}
                    onChangeText={setCompanyHireDate}
                    editable={isEditing && isAdmin}
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Engineer Date</ThemedText>
                  <ThemedTextInput
                    value={engineerDate}
                    onChangeText={setEngineerDate}
                    editable={isEditing && isAdmin}
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Division</ThemedText>
                  <ThemedTextInput
                    value={division || ""}
                    onChangeText={(text) => setDivision(text as Division)}
                    editable={isEditing && isAdmin}
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Zone</ThemedText>
                  <ThemedTextInput
                    value={zone || ""}
                    onChangeText={(text) => setZone(text as Zone)}
                    editable={isEditing && isAdmin}
                    style={[styles.input, !isAdmin && styles.disabledInput]}
                  />
                </View>
              </View>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    backgroundColor: "#000000",
  },
  content: {
    padding: 20,
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
    backgroundColor: "#000000",
  },
  contentMobile: {
    padding: 16,
    backgroundColor: "#000000",
  },
  headerContainer: {
    paddingTop: 0,
    paddingBottom: 10,
    backgroundColor: "#000000",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#000000",
  },
  profileContainer: {
    backgroundColor: "#000000",
  },
  title: {
    color: "#BAC42A",
    fontSize: 24,
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#BAC42A",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#BAC42A",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.7,
    borderColor: "#666666",
  },
  error: {
    color: "#FF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  infoNote: {
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#BAC42A",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  headerButton: {
    padding: 8,
  },
});
