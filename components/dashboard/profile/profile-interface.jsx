import React, { useState } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { authAxios } from "@/utils/axios";
import { AvatarInput } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import { toast } from "react-toastify";
import { User, Mail, Building, Shield, Lock, Eye, EyeOff } from "lucide-react";

export function ProfileInterface({ user, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState(user);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Update local state when user prop changes
  React.useEffect(() => {
    if (user) {
      setUserData(user);
    }
  }, [user]);

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await authAxios.put("/accounts/me/avatar/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update local state with new avatar
      setUserData((prev) => ({
        ...prev,
        avatar: response.data.avatar,
      }));

      toast.success(
        intl.formatMessage({ id: "Avatar updated successfully!" })
      );

      // Optionally refresh the page to update global user context
      // Or trigger a refresh of the user data from the server
      setTimeout(() => {
        router.reload();
      }, 1000);
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(
        error?.response?.data?.avatar?.[0] ||
          intl.formatMessage({ id: "Failed to update avatar. Please try again." })
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    // Client-side validation
    if (!passwordForm.old_password) {
      setPasswordErrors({ old_password: intl.formatMessage({ id: "Old password is required" }) });
      return;
    }
    if (!passwordForm.new_password) {
      setPasswordErrors({ new_password: intl.formatMessage({ id: "New password is required" }) });
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordErrors({ new_password: intl.formatMessage({ id: "Password must be at least 8 characters long" }) });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({ confirm_password: intl.formatMessage({ id: "Passwords do not match" }) });
      return;
    }
    if (passwordForm.old_password === passwordForm.new_password) {
      setPasswordErrors({ new_password: intl.formatMessage({ id: "New password must be different from old password" }) });
      return;
    }

    try {
      setChangingPassword(true);

      await authAxios.put("/accounts/password/update/", {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });

      toast.success(
        intl.formatMessage({ id: "Password changed successfully!" })
      );

      // Reset form
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setShowPasswordForm(false);
      setPasswordErrors({});
    } catch (error) {
      console.error("Password change error:", error);
      const errorData = error?.response?.data || {};
      
      // Handle validation errors
      if (errorData.old_password) {
        setPasswordErrors({ old_password: Array.isArray(errorData.old_password) ? errorData.old_password[0] : errorData.old_password });
      } else if (errorData.new_password) {
        setPasswordErrors({ new_password: Array.isArray(errorData.new_password) ? errorData.new_password[0] : errorData.new_password });
      } else if (errorData.detail) {
        toast.error(errorData.detail);
      } else {
        toast.error(
          intl.formatMessage({ id: "Failed to change password. Please try again." })
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const roleLabels = {
    STUDENT: intl.formatMessage({ id: "Student" }),
    GUEST: intl.formatMessage({ id: "Guest" }),
    TEACHER: intl.formatMessage({ id: "Teacher" }),
    ASSISTANT: intl.formatMessage({ id: "Assistant" }),
    CENTER_ADMIN: intl.formatMessage({ id: "Center Admin" }),
    OWNER: intl.formatMessage({ id: "Owner" }),
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
          <AvatarInput
            initialImage={userData.avatar || ""}
            onUpload={handleAvatarUpload}
            accept="image/*"
            reqLoading={uploading}
          />
          <p className="text-sm text-gray-500 mt-4 text-center max-w-md">
            {intl.formatMessage({
              id: "Click on the avatar to upload a new profile picture",
            })}
          </p>
        </div>

        {/* User Information Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {intl.formatMessage({ id: "Account Information" })}
          </h3>

          {/* Full Name */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                {intl.formatMessage({ id: "Full Name" })}
              </label>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {userData.full_name || "-"}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                {intl.formatMessage({ id: "Email" })}
              </label>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {userData.email || "-"}
              </p>
            </div>
          </div>

          {/* Center */}
          {userData.center && (
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-2 bg-white rounded-lg">
                <Building className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  {intl.formatMessage({ id: "Education Center" })}
                </label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {typeof userData.center === "object"
                    ? userData.center.name
                    : userData.center}
                </p>
              </div>
            </div>
          )}

          {/* Role */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                {intl.formatMessage({ id: "Role" })}
              </label>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {roleLabels[userData.role] || userData.role}
              </p>
            </div>
          </div>

          {/* Group (if student) */}
          {userData.group && (
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-2 bg-white rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  {intl.formatMessage({ id: "Group" })}
                </label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {typeof userData.group === "object"
                    ? userData.group.name
                    : userData.group}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {intl.formatMessage({ id: "Change Password" })}
            </h3>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 text-sm font-medium text-main bg-main/10 rounded-lg hover:bg-main/20 transition-colors"
              >
                {intl.formatMessage({ id: "Change Password" })}
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Old Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {intl.formatMessage({ id: "Current Password" })}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? "text" : "password"}
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, old_password: e.target.value })
                    }
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-main ${
                      passwordErrors.old_password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={intl.formatMessage({ id: "Enter current password" })}
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.old_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.old_password}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {intl.formatMessage({ id: "New Password" })}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new_password: e.target.value })
                    }
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-main ${
                      passwordErrors.new_password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={intl.formatMessage({ id: "Enter new password (min 8 characters)" })}
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {intl.formatMessage({ id: "Confirm New Password" })}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                    }
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-main ${
                      passwordErrors.confirm_password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={intl.formatMessage({ id: "Confirm new password" })}
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm_password}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-2 bg-main text-white rounded-lg font-medium hover:bg-main/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {changingPassword && <ButtonSpinner />}
                  {intl.formatMessage({ id: "Update Password" })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      old_password: "",
                      new_password: "",
                      confirm_password: "",
                    });
                    setPasswordErrors({});
                  }}
                  disabled={changingPassword}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {intl.formatMessage({ id: "Cancel" })}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

