import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";

export default function PrivacySettings({ profile, updateProfile }) {
    const [settings, setSettings] = useState({
        showProfile: true,
        marketingEmails: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile && profile.privacySettings) {
            setSettings({
                showProfile: profile.privacySettings.showProfile !== undefined ? profile.privacySettings.showProfile : true,
                marketingEmails: profile.privacySettings.marketingEmails !== undefined ? profile.privacySettings.marketingEmails : true
            });
        }
    }, [profile]);

    const handleToggle = async (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings); // Optimistic update
        setSaving(true);
        const result = await updateProfile({ privacySettings: newSettings });
        setSaving(false);
        if (!result.success) {
            setSettings(settings); // Revert if failed
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Quản lý quyền riêng tư và dữ liệu</h2>
                <p className="text-gray-600 mt-1">
                    Thực hiện quyền riêng tư, kiểm soát dữ liệu hoặc trích xuất thông tin của bạn.
                </p>
            </div>

            <div className="border rounded-lg divide-y divide-gray-200 bg-white">
                {/* Show Profile */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4">
                        <p className="font-medium text-gray-900">Hiển thị hồ sơ</p>
                        <p className="text-gray-600 text-sm mt-1">
                            Cho phép người khác nhìn thấy tên hiển thị và ảnh đại diện của bạn khi bạn để lại đánh giá.
                        </p>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input
                            type="checkbox"
                            name="showProfile"
                            id="showProfile"
                            checked={settings.showProfile}
                            onChange={() => handleToggle('showProfile')}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                            style={{
                                right: settings.showProfile ? '0' : 'auto',
                                left: settings.showProfile ? 'auto' : '0',
                                borderColor: settings.showProfile ? '#2563EB' : '#D1D5DB'
                            }}
                            disabled={saving}
                        />
                        <label
                            htmlFor="showProfile"
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.showProfile ? 'bg-blue-600' : 'bg-gray-300'}`}
                        ></label>
                    </div>
                </div>

                {/* Marketing Emails */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4">
                        <p className="font-medium text-gray-900">Email tiếp thị</p>
                        <p className="text-gray-600 text-sm mt-1">
                            Nhận email về các ưu đãi đặc biệt, đề xuất chuyến đi và cập nhật từ chúng tôi.
                        </p>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input
                            type="checkbox"
                            name="marketingEmails"
                            id="marketingEmails"
                            checked={settings.marketingEmails}
                            onChange={() => handleToggle('marketingEmails')}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                            style={{
                                right: settings.marketingEmails ? '0' : 'auto',
                                left: settings.marketingEmails ? 'auto' : '0',
                                borderColor: settings.marketingEmails ? '#2563EB' : '#D1D5DB'
                            }}
                            disabled={saving}
                        />
                        <label
                            htmlFor="marketingEmails"
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.marketingEmails ? 'bg-blue-600' : 'bg-gray-300'}`}
                        ></label>
                    </div>
                </div>
            </div>
        </div>
    );
}
