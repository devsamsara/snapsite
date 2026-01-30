import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  
  // State for form fields
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [role, setRole] = useState("Project Manager");
  const [company, setCompany] = useState("FieldCam Inc.");

  const handleGoBack = () => {
    router.back();
  };

  const handleSave = () => {
    // TODO: Implement save logic
    Alert.alert("Success", "Profile updated successfully", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const handleChangePhoto = () => {
    // TODO: Implement photo picker
    Alert.alert("Change Photo", "Photo picker will be implemented here");
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleGoBack}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.surface, marginRight: 16 }}
              >
                <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">Edit Profile</Text>
            </View>
            <TouchableOpacity
              onPress={handleSave}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="font-semibold" style={{ color: "#FFFFFF" }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <View className="items-center mb-8">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="person.fill" size={48} color="#FFFFFF" />
            </View>
            <TouchableOpacity onPress={handleChangePhoto}>
              <Text className="font-semibold" style={{ color: colors.primary }}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="gap-4 mb-8">
            {/* Name Field */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-2 uppercase">
                Full Name
              </Text>
              <View
                className="bg-surface rounded-2xl px-4 py-3 border border-border"
                style={{ borderColor: colors.border }}
              >
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.muted}
                  style={{ 
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "500"
                  }}
                />
              </View>
            </View>

            {/* Email Field */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-2 uppercase">
                Email
              </Text>
              <View
                className="bg-surface rounded-2xl px-4 py-3 border border-border"
                style={{ borderColor: colors.border }}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ 
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "500"
                  }}
                />
              </View>
            </View>

            {/* Phone Field */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-2 uppercase">
                Phone Number
              </Text>
              <View
                className="bg-surface rounded-2xl px-4 py-3 border border-border"
                style={{ borderColor: colors.border }}
              >
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  style={{ 
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "500"
                  }}
                />
              </View>
            </View>

            {/* Role Field */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-2 uppercase">
                Role
              </Text>
              <View
                className="bg-surface rounded-2xl px-4 py-3 border border-border"
                style={{ borderColor: colors.border }}
              >
                <TextInput
                  value={role}
                  onChangeText={setRole}
                  placeholder="Enter your role"
                  placeholderTextColor={colors.muted}
                  style={{ 
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "500"
                  }}
                />
              </View>
            </View>

            {/* Company Field */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-2 uppercase">
                Company
              </Text>
              <View
                className="bg-surface rounded-2xl px-4 py-3 border border-border"
                style={{ borderColor: colors.border }}
              >
                <TextInput
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Enter your company"
                  placeholderTextColor={colors.muted}
                  style={{ 
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "500"
                  }}
                />
              </View>
            </View>
          </View>

          {/* Additional Options */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-muted mb-3 uppercase">
              Additional Options
            </Text>
            
            <View
              className="bg-surface rounded-2xl border border-border"
              style={{ borderColor: colors.border }}
            >
              {/* Change Password */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="lock.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    Change Password
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>

              {/* Delete Account */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="trash.fill" size={20} color={colors.error} />
                  <Text className="font-semibold" style={{ color: colors.error, marginLeft: 16 }}>
                    Delete Account
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
