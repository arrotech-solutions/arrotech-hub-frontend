import React, { useState } from 'react';
import { Calendar as CalendarIcon, Upload, Sparkles, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';

const TikTokScheduler: React.FC = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedPath, setUploadedPath] = useState<string | null>(null);

    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('funny');
    const [caption, setCaption] = useState('');
    const [generating, setGenerating] = useState(false);

    const [scheduledTime, setScheduledTime] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setVideoFile(file);

            // Auto upload on select
            setUploading(true);
            try {
                const res = await apiService.uploadTikTokVideo(file);
                if ((res as any).success) {
                    setUploadedPath((res as any).file_path); // Path returned from backend
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
            const res = await apiService.createTikTokPost({
                caption,
                video_path: uploadedPath,
                scheduled_time: scheduledTime || undefined // If empty, it's a draft
            });

            if (res.success) {
                toast.success('Post scheduled successfully!');
                // Reset form
                setVideoFile(null);
                setUploadedPath(null);
                setTopic('');
                setCaption('');
                setScheduledTime('');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule post');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Scheduler & Content Creator
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Upload */}
                <div className="space-y-6">
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploadedPath ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-black'}`}>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="video-upload"
                        />
                        <label htmlFor="video-upload" className="cursor-pointer block">
                            {uploading ? (
                                <div className="text-gray-500">Uploading...</div>
                            ) : uploadedPath ? (
                                <div className="text-green-600 flex flex-col items-center">
                                    <Check className="w-8 h-8 mb-2" />
                                    <span className="font-medium">Video Ready</span>
                                    <span className="text-xs text-gray-400 mt-1">{videoFile?.name}</span>
                                </div>
                            ) : (
                                <div className="text-gray-500 flex flex-col items-center">
                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                    <span className="font-medium">Click to Upload Video</span>
                                    <span className="text-xs text-gray-400 mt-1">MP4, MOV up to 60s</span>
                                </div>
                            )}
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Schedule Time (Optional)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="datetime-local"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500">Leave blank to save as Draft</p>
                    </div>
                </div>

                {/* Right Column: AI Content */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Generate "Sheng" Caption</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Topic (e.g. Traffic in Nairobi, New Matatu)"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                            />
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="px-4 py-2 border rounded-lg outline-none bg-gray-50"
                            >
                                <option value="funny">Funny</option>
                                <option value="angry">Hype</option>
                                <option value="informative">Informative</option>
                            </select>
                        </div>
                        <button
                            onClick={handleGenerateCaption}
                            disabled={generating}
                            className="w-full py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            {generating ? 'Cooking...' : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate AI Caption
                                </>
                            )}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Final Caption</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                            placeholder="#Sheng #Nairobi #TikTok..."
                        />
                    </div>

                    <button
                        onClick={handleSchedule}
                        className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        {scheduledTime ? 'Schedule Post' : 'Save Draft'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TikTokScheduler;
