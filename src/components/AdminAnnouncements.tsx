/**
 * AdminAnnouncements Component
 * 
 * Admin panel for managing homepage announcements/banners.
 * Supports adding image banners or text announcements with preview.
 */

import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Image,
    Type,
    X,
    ChevronUp,
    ChevronDown,
    Edit2,
} from "lucide-react";
import { Announcement } from "../types";
import {
    getAllAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from "../services/announcements";
import { uploadImage } from "../services/cloudinary";

interface AdminAnnouncementsProps {
    onClose?: () => void;
}

export function AdminAnnouncements({ onClose }: AdminAnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'image' | 'text'>('text');
    const [uploading, setUploading] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        imageUrl: "",
        backgroundColor: "#059669", // emerald-600
        link: "",
    });

    // Load announcements
    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await getAllAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error("Error loading announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadImage(file);
            setFormData((prev) => ({ ...prev, imageUrl: result.url }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    // Handle edit announcement - populate form with existing data
    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setFormType(announcement.type);
        setFormData({
            title: announcement.title || "",
            message: announcement.message || "",
            imageUrl: announcement.imageUrl || "",
            backgroundColor: announcement.backgroundColor || "#059669",
            link: announcement.link || "",
        });
        setShowForm(true);
    };

    // Handle save announcement (add or update)
    const handleSave = async () => {
        try {
            if (editingAnnouncement) {
                // Update existing announcement
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updateData: any = {
                    type: formType,
                };

                // Only add fields that have values
                if (formData.title) updateData.title = formData.title;
                else updateData.title = "";
                if (formData.message) updateData.message = formData.message;
                else updateData.message = "";
                if (formType === 'image' && formData.imageUrl) {
                    updateData.imageUrl = formData.imageUrl;
                }
                if (formType === 'text' && formData.backgroundColor) {
                    updateData.backgroundColor = formData.backgroundColor;
                }
                if (formData.link) updateData.link = formData.link;
                else updateData.link = "";

                await updateAnnouncement(editingAnnouncement.id, updateData);

                setAnnouncements((prev) =>
                    prev.map((a) =>
                        a.id === editingAnnouncement.id
                            ? { ...a, ...updateData }
                            : a
                    )
                );
            } else {
                // Add new announcement
                const maxOrder = announcements.length > 0
                    ? Math.max(...announcements.map((a) => a.order))
                    : 0;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const announcementData: any = {
                    type: formType,
                    active: true,
                    order: maxOrder + 1,
                };

                if (formData.title) announcementData.title = formData.title;
                if (formData.message) announcementData.message = formData.message;
                if (formType === 'image' && formData.imageUrl) {
                    announcementData.imageUrl = formData.imageUrl;
                }
                if (formType === 'text' && formData.backgroundColor) {
                    announcementData.backgroundColor = formData.backgroundColor;
                }
                if (formData.link) announcementData.link = formData.link;

                const newAnnouncement = await addAnnouncement(announcementData);
                setAnnouncements((prev) => [...prev, newAnnouncement]);
            }
            resetForm();
        } catch (error) {
            console.error("Error saving announcement:", error);
            alert("Failed to save announcement");
        }
    };

    // Handle toggle active
    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            await updateAnnouncement(id, { active: !currentActive });
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === id ? { ...a, active: !currentActive } : a))
            );
        } catch (error) {
            console.error("Error toggling announcement:", error);
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this announcement?")) return;

        try {
            await deleteAnnouncement(id);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    // Handle reorder
    const handleMoveUp = async (index: number) => {
        if (index === 0) return;

        const current = announcements[index];
        const above = announcements[index - 1];

        try {
            await updateAnnouncement(current.id, { order: above.order });
            await updateAnnouncement(above.id, { order: current.order });

            const newAnnouncements = [...announcements];
            [newAnnouncements[index - 1], newAnnouncements[index]] =
                [newAnnouncements[index], newAnnouncements[index - 1]];
            setAnnouncements(newAnnouncements);
        } catch (error) {
            console.error("Error reordering:", error);
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === announcements.length - 1) return;

        const current = announcements[index];
        const below = announcements[index + 1];

        try {
            await updateAnnouncement(current.id, { order: below.order });
            await updateAnnouncement(below.id, { order: current.order });

            const newAnnouncements = [...announcements];
            [newAnnouncements[index], newAnnouncements[index + 1]] =
                [newAnnouncements[index + 1], newAnnouncements[index]];
            setAnnouncements(newAnnouncements);
        } catch (error) {
            console.error("Error reordering:", error);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setFormType('text');
        setEditingAnnouncement(null);
        setFormData({
            title: "",
            message: "",
            imageUrl: "",
            backgroundColor: "#059669",
            link: "",
        });
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">
                    Announcements & Banners
                </h2>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex-1 sm:flex-none justify-center bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-2 text-sm font-semibold shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New</span>
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Add Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Add Announcement</h3>
                            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Type Selection */}
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setFormType('text')}
                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${formType === 'text'
                                        ? 'border-emerald-600 bg-emerald-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Type className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                                    <span className="block text-sm font-medium">Text Announcement</span>
                                </button>
                                <button
                                    onClick={() => setFormType('image')}
                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${formType === 'image'
                                        ? 'border-emerald-600 bg-emerald-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Image className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                                    <span className="block text-sm font-medium">Image Banner</span>
                                </button>
                            </div>

                            {/* Form Fields */}
                            {formType === 'text' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Title (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            placeholder="e.g., Special Offer!"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            placeholder="Your announcement message..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Background Color
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                value={formData.backgroundColor}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                                                className="w-12 h-10 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.backgroundColor}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Banner Image
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="w-full"
                                            disabled={uploading}
                                        />
                                        {uploading && (
                                            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Or paste image URL
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Link Input (for both types) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Link URL (optional - makes banner clickable)
                                </label>
                                <input
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="https://example.com or /vendor/register"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty for non-clickable banner. Use full URL for external links.
                                </p>
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preview
                                </label>
                                <div
                                    className="h-32 rounded-lg flex items-center justify-center overflow-hidden"
                                    style={{
                                        backgroundColor: formType === 'text'
                                            ? formData.backgroundColor
                                            : '#f0fdf4'
                                    }}
                                >
                                    {formType === 'image' && formData.imageUrl ? (
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : formType === 'text' ? (
                                        <div className="text-center px-4">
                                            {formData.title && (
                                                <h3 className="text-lg font-bold text-white mb-1">
                                                    {formData.title}
                                                </h3>
                                            )}
                                            {formData.message && (
                                                <p className="text-white/90 text-sm">
                                                    {formData.message}
                                                </p>
                                            )}
                                            {!formData.title && !formData.message && (
                                                <p className="text-white/50 text-sm">Preview will appear here</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">Upload an image to preview</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={formType === 'image' ? !formData.imageUrl : (!formData.title && !formData.message)}
                                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingAnnouncement ? 'Save Changes' : 'Add Announcement'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="p-4">
                {announcements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Image className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No announcements yet.</p>
                        <p className="text-sm">Click "Add New" to create your first announcement.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {announcements.map((announcement, index) => (
                            <div
                                key={announcement.id}
                                className={`flex flex-col sm:flex-row sm:items-center p-4 rounded-xl border gap-4 transition-all duration-300 ${announcement.active
                                    ? 'border-emerald-200 bg-emerald-50/50 shadow-sm'
                                    : 'border-gray-200 bg-gray-50/30'
                                    }`}
                            >
                                {/* Thumbnail */}
                                <div
                                    className="w-full sm:w-24 h-32 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm"
                                    style={{
                                        backgroundColor: announcement.type === 'text'
                                            ? announcement.backgroundColor
                                            : '#f0fdf4'
                                    }}
                                >
                                    {announcement.type === 'image' && announcement.imageUrl ? (
                                        <img
                                            src={announcement.imageUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Type className="w-6 h-6 sm:w-5 sm:h-5 text-white/80" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate text-base">
                                        {announcement.title || announcement.message || 'Image Banner'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 border border-black/5 text-gray-600">
                                            {announcement.type === 'image' ? 'Image' : 'Text'}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${announcement.active ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                            {announcement.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-1.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-none">
                                    <div className="flex items-center bg-white/50 rounded-lg p-1 border border-black/5">
                                        <button
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className="p-1.5 text-gray-500 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                                            title="Move up"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === announcements.length - 1}
                                            className="p-1.5 text-gray-500 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                                            title="Move down"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleToggleActive(announcement.id, announcement.active)}
                                        className={`p-2 rounded-lg transition-all ${announcement.active
                                            ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200'
                                            : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        title={announcement.active ? 'Deactivate' : 'Activate'}
                                    >
                                        {announcement.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(announcement)}
                                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(announcement.id)}
                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
