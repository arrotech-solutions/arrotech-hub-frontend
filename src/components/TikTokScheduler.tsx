import React, { useState } from 'react';
import { Calendar as CalendarIcon, Upload, Sparkles, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';

const TikTokScheduler: React.FC = () => {
    // ... state hooks same as before ...
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedPath, setUploadedPath] = useState<string | null>(null);

    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('funny');
    const [caption, setCaption] = useState('');
    const [generating, setGenerating] = useState(false);

    const [scheduledTime, setScheduledTime] = useState('');
    const [privacyLevel, setPrivacyLevel] = useState('SELF_ONLY'); // Default to Private

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... (no change in file handling logic, but need to preserve it if replacing block)
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setVideoFile(file);
            setUploading(true);
            try {
                const res = await apiService.uploadTikTokVideo(file);
                if ((res as any).success) {
                    setUploadedPath((res as any).file_path);
                    toast.success('Video uploaded successfully');
                } else {
                    toast.error('Upload failed: ' + (res as any).message);
                }
            } catch (error) {
                console.error(error);
                toast.error('Video upload failed');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleGenerateCaption = async () => {
        // ... (preserve caption logic)
        if (!topic) {
            toast.error('Please enter a topic for the caption');
            return;
        }
        setGenerating(true);
        try {
            const res = await apiService.generateTikTokCaption({ topic, tone });
            if ((res as any).success) {
                setCaption((res as any).caption);
                toast.success('Sheng caption generated!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate caption');
        } finally {
            setGenerating(false);
        }
    };

    const handleSchedule = async () => {
        if (!uploadedPath) {
            toast.error('Please upload a video first');
            return;
        }
        if (!caption) {
            toast.error('Please add a caption');
            return;
        }

        try {
            let finalScheduledTime = undefined;
            if (scheduledTime) {
                const date = new Date(scheduledTime);
                finalScheduledTime = date.toISOString();
            }

            const res = await apiService.createTikTokPost({
                caption,
                video_path: uploadedPath,
                scheduled_time: finalScheduledTime,
                privacy_level: privacyLevel // Adding new field
            });

            if (res.success) {
                toast.success('Post scheduled successfully!');
                setVideoFile(null);
                setUploadedPath(null);
                setTopic('');
                setCaption('');
                setScheduledTime('');
                setPrivacyLevel('SELF_ONLY');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule post');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/50 p-6 md:p-8">
            {/* ... preserve header ... */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                <div className="p-2 bg-black text-white rounded-lg">
                    <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Smart Scheduler</h2>
                    <p className="text-xs text-slate-400">Post now or schedule for later</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column: Upload */}
                <div className="space-y-6">
                    {/* ... preserve upload UI ... */}
                    <div className="group relative">
                        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${uploadedPath ? 'border-green-500 bg-green-50/30' : 'border-slate-200 hover:border-black hover:bg-slate-50'}`}>
                            {/* ... input logic ... */}
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="video-upload"
                            />
                            <label htmlFor="video-upload" className="cursor-pointer block w-full h-full">
                                {uploading ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
                                        <span className="text-sm font-medium text-gray-500">Uploading to cloud...</span>
                                    </div>
                                ) : uploadedPath ? (
                                    <div className="text-green-600 flex flex-col items-center transition-transform transform group-hover:scale-105">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-lg">Video Ready</span>
                                        <span className="text-xs text-green-600/70 mt-1 max-w-[200px] truncate">{videoFile?.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 flex flex-col items-center transition-transform transform group-hover:scale-105">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
                                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-black" />
                                        </div>
                                        <span className="font-semibold text-slate-700">Drop Video Here</span>
                                        <span className="text-xs text-slate-400 mt-2">MP4 or MOV • Max 60s</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {/* ... preserve schedule time input ... */}
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            Schedule Time <span className="text-xs font-normal text-slate-400">(Optional)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Right Column: AI Content */}
                <div className="space-y-6">
                    {/* ... preserve AI generator ... */}
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl border border-pink-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-pink-500" />
                            <h3 className="text-sm font-bold text-slate-800">AI Caption Generator</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Topic (e.g. Nairobi Traffic)"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full sm:flex-1 px-4 py-2.5 bg-white border border-pink-100 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 outline-none"
                                />
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2.5 bg-white border border-pink-100 rounded-lg text-sm outline-none cursor-pointer"
                                >
                                    <option value="funny">Running</option>
                                    <option value="angry">Hype</option>
                                    <option value="informative">Info</option>
                                </select>
                            </div>
                            <button
                                onClick={handleGenerateCaption}
                                disabled={generating}
                                className="w-full py-2.5 bg-gradient-to-r from-[#FE2C55] to-[#FF0050] text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {generating ? 'Magic in progress...' : 'Generate Caption'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Final Caption</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none text-sm leading-relaxed"
                            placeholder="Your awesome caption will appear here..."
                        />
                    </div>

                    {/* New Privacy Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Privacy Setting</label>
                        <select
                            value={privacyLevel}
                            onChange={(e) => setPrivacyLevel(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm cursor-pointer"
                        >
                            <option value="SELF_ONLY">🔒 Private (Self Only)</option>
                            <option value="MUTUAL_FOLLOW_FRIENDS">👥 Friends Only</option>
                            <option value="PUBLIC_TO_EVERYONE">🌍 Public to Everyone</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSchedule}
                        className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {scheduledTime ? (
                            <><Clock className="w-4 h-4" /> Schedule Post</>
                        ) : (
                            'Save & Publish'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TikTokScheduler;
