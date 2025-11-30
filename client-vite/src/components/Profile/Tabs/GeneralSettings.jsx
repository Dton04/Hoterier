import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";

export default function GeneralSettings({ profile, updateProfile }) {
    const [settings, setSettings] = useState({
        currency: "VND",
        language: "vi"
    });
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile && profile.settings) {
            setSettings({
                currency: profile.settings.currency || "VND",
                language: profile.settings.language || "vi"
            });
        }
    }, [profile]);

    const handleSave = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSaving(true);
        const result = await updateProfile({ settings: newSettings });
        setSaving(false);
        if (result.success) {
            setSettings(newSettings);
            setEditing(null);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cài đặt chung</h2>
                <p className="text-gray-600 mt-1">
                    Cá nhân hóa tài khoản để phù hợp với nhu cầu của bạn.
                </p>
            </div>

            <div className="border rounded-lg divide-y divide-gray-200 bg-white">
                {/* Currency */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4 flex-1">
                        <p className="font-medium text-gray-900">Tiền tệ</p>
                        {editing === 'currency' ? (
                            <select
                                className="mt-2 border rounded p-1 w-full max-w-xs"
                                value={settings.currency}
                                onChange={(e) => handleSave('currency', e.target.value)}
                                disabled={saving}
                            >
                                <option value="VND">VND - Đồng Việt Nam</option>
                                <option value="USD">USD - Đô la Mỹ</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        ) : (
                            <p className="text-gray-600 text-sm mt-1">
                                {settings.currency}
                            </p>
                        )}
                    </div>
                    {editing !== 'currency' && (
                        <button
                            onClick={() => setEditing('currency')}
                            className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded shrink-0"
                        >
                            Chỉnh sửa
                        </button>
                    )}
                </div>

                {/* Language */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4 flex-1">
                        <p className="font-medium text-gray-900">Ngôn ngữ</p>
                        {editing === 'language' ? (
                            <select
                                className="mt-2 border rounded p-1 w-full max-w-xs"
                                value={settings.language}
                                onChange={(e) => handleSave('language', e.target.value)}
                                disabled={saving}
                            >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English (US)</option>
                                <option value="fr">Français</option>
                            </select>
                        ) : (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg">{settings.language === 'vi' ? '🇻🇳' : settings.language === 'en' ? '🇺🇸' : '🇫🇷'}</span>
                                <span className="text-gray-600 text-sm">
                                    {settings.language === 'vi' ? 'Tiếng Việt' : settings.language === 'en' ? 'English (US)' : 'Français'}
                                </span>
                            </div>
                        )}
                    </div>
                    {editing !== 'language' && (
                        <button
                            onClick={() => setEditing('language')}
                            className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded shrink-0"
                        >
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
