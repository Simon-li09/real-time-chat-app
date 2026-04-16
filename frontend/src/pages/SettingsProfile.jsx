import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { ArrowLeft, Camera, Check, User, Info } from 'lucide-react';

const SettingsProfile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [name, setName] = useState(user?.first_name || user?.username || '');
    const [about, setAbout] = useState(user?.bio || '');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await userService.updateSettings({ name, about });
            // Update local user data
            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setLoading(true);
        try {
            const response = await userService.updateSettings(formData);
            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="bg-emerald-600 text-white px-4 py-6 sticky top-0 z-10 shadow-md">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/settings')} className="hover:bg-emerald-700 p-1 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold">Profile</h1>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-white text-emerald-600 px-4 py-1.5 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-200">
                            {user?.profile_picture ? (
                                <img 
                                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture}`} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200">
                                    <User size={48} />
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="absolute bottom-0 right-0 p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all transform hover:scale-110 active:scale-95"
                        >
                            <Camera size={20} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <p className="mt-4 text-sm text-slate-500 font-medium tracking-wide">Tap to change profile photo</p>
                </div>

                {/* Info Fields */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                                <User size={16} className="opacity-70" />
                                <label className="text-xs font-bold uppercase tracking-wider">Display Name</label>
                            </div>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full text-lg font-medium border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2 transition-all placeholder-slate-300"
                                placeholder="Enter your name"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">This is not your username or pin. This name will be visible to your contacts.</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                                <Info size={16} className="opacity-70" />
                                <label className="text-xs font-bold uppercase tracking-wider">About</label>
                            </div>
                            <textarea 
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                className="w-full text-base border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2 transition-all resize-none min-h-[80px] placeholder-slate-300"
                                placeholder="Hey there! I am using RealTime Chat"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsProfile;
