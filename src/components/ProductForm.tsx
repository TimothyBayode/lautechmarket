import React, { useEffect, useState, useRef } from "react";
import { X, Upload, Loader2, ChevronDown, Layers, Tag } from "lucide-react";
import { Product } from "../types";
import {
    fetchBuckets,
    fetchCategories,
    Bucket,
    Category
} from "../services/categories";
import { uploadImage } from "../services/storage";
import { getProxiedImageUrl } from "../utils/imageUrl";

interface ProductFormProps {
    product: Product | null;
    onSave: (product: Product) => void;
    onCancel: () => void;
    vendorName?: string; // Pre-filled vendor name (read-only)
    whatsappNumber?: string; // Pre-filled whatsapp number (read-only)
}

export function ProductForm({ product, onSave, onCancel, vendorName, whatsappNumber }: ProductFormProps) {
    const [formData, setFormData] = useState<Omit<Product, 'price'> & { price: number | string }>({
        id: "",
        name: "",
        description: "",
        price: product ? product.price : "",
        category: "",
        bucketId: "",
        image: "",
        inStock: true,
        whatsappNumber: "",
        vendorName: "",
    });

    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [imagePreview, setImagePreview] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (product) {
            setFormData(product);
            setImagePreview(product.image);
            if (product.bucketId) {
                loadCategories(product.bucketId);
            }
        }
    }, [product]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const bucketsData = await fetchBuckets();
            setBuckets(bucketsData);

            // If editing and has bucket, categories already loading via useEffect
            // If new product, we wait for bucket selection
        } catch (err) {
            console.error("Failed to load buckets:", err);
            setError("Failed to load categories infrastructure");
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async (bucketId: string) => {
        try {
            const data = await fetchCategories(bucketId);
            setCategories(data);
        } catch (err) {
            console.error("Failed to load subcategories:", err);
        }
    };

    const handleBucketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bucketId = e.target.value;
        setFormData(prev => ({ ...prev, bucketId, category: "" })); // Reset category when bucket changes
        if (bucketId) {
            loadCategories(bucketId);
        } else {
            setCategories([]);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "price"
                    ? value
                    : type === "checkbox"
                        ? (e.target as HTMLInputElement).checked
                        : value,
        }));

        // Update preview for URL input
        if (name === "image" && value) {
            setImagePreview(value);
        }
    };

    // Handle file selection and upload to Cloudflare
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        setUploadingImage(true);
        setError("");

        try {
            // Upload to Cloudflare
            const result = await uploadImage(file);

            setFormData((prev) => ({ ...prev, image: result.url }));
            setImagePreview(result.url);
        } catch (err: any) {
            console.error("Error uploading image:", err);
            setError(err.message || "Failed to upload image");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.bucketId) {
            setError("Please select a main category (Bucket)");
            return;
        }
        if (categories.length > 0 && !formData.category) {
            setError("Please select a subcategory");
            return;
        }
        if (formData.description.trim().length < 40) {
            setError("Description must be at least 40 characters");
            return;
        }
        setError("");

        // Convert price back to number for saving
        const finalPrice = typeof formData.price === 'string'
            ? parseFloat(formData.price) || 0
            : formData.price;

        onSave({
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: finalPrice
        } as Product);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-gray-500 font-medium font-black uppercase text-xs tracking-widest">Waking up the database...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {product ? "Edit Listing" : "Create New Listing"}
                    </h2>
                    <p className="text-gray-500 font-medium">Fill in the details for your product or service</p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-in shake duration-500">
                    <p className="text-red-700 text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        {error}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField
                        label="What are you listing?"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. iPhone 13 Pro, Professional Laundry Service..."
                    />
                    <InputField
                        label="Price (₦)"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                    />

                    {/* Bucket Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                            Main Category (Bucket) *
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                <Layers className="w-5 h-5" />
                            </div>
                            <select
                                name="bucketId"
                                value={formData.bucketId}
                                onChange={handleBucketChange}
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all appearance-none font-bold text-gray-700"
                            >
                                <option value="">Select Category Type</option>
                                {buckets.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Subcategory Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                            Subcategory {categories.length > 0 ? "*" : "(Optional)"}
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                <Tag className="w-5 h-5" />
                            </div>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required={categories.length > 0}
                                disabled={!formData.bucketId || categories.length === 0}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all appearance-none font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {!formData.bucketId
                                        ? "Pick a Main Category First"
                                        : categories.length === 0
                                            ? "No subcategories available"
                                            : "Select Subcategory"}
                                </option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Vendor Name - Read-only if provided via props */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vendor Name *
                        </label>
                        <input
                            name="vendorName"
                            type="text"
                            value={vendorName || formData.vendorName}
                            onChange={vendorName ? undefined : handleChange}
                            readOnly={!!vendorName}
                            required
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${vendorName ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                        />
                    </div>

                    {/* WhatsApp Number - Read-only if provided via props */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Number *
                        </label>
                        <input
                            name="whatsappNumber"
                            type="text"
                            value={whatsappNumber || formData.whatsappNumber}
                            onChange={whatsappNumber ? undefined : handleChange}
                            readOnly={!!whatsappNumber}
                            placeholder="+2348012345678"
                            required
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${whatsappNumber ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                        />
                    </div>
                </div>

                {/* Image Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Image *
                    </label>

                    <div className="space-y-4">
                        {/* Upload Button */}
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploadingImage ? (
                                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5 text-gray-500" />
                                )}
                                <span className="text-gray-700">
                                    {uploadingImage ? "Uploading..." : "Upload Image"}
                                </span>
                            </button>
                            {uploadingImage && (
                                <span className="text-sm text-gray-500">Please wait...</span>
                            )}
                        </div>

                        {/* Or use URL */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Or paste image URL:</span>
                        </div>
                        <input
                            name="image"
                            type="url"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="mt-3">
                                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                                <div className="relative w-40 h-40 border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={getProxiedImageUrl(imagePreview) || imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={() => {
                                            // Fallback or retry logic could go here
                                            console.warn("Image preview failed loading:", imagePreview);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Description (Min 40 characters) *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        required
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Describe exactly what this product or service includes, the price or price range, and any important details a student should know (location, turnaround time, or home service)."
                    />
                    <div className="mt-1 flex justify-end">
                        {formData.description.trim().length < 40 && (
                            <span className="text-xs text-red-500 font-medium">
                                {formData.description.trim().length} / 40 characters minimum
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        id="inStock"
                        name="inStock"
                        type="checkbox"
                        checked={formData.inStock}
                        onChange={handleChange}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label
                        htmlFor="inStock"
                        className="ml-2 text-sm font-medium text-gray-700"
                    >
                        In Stock
                    </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={uploadingImage}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {product ? "Update Product" : "Add Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}

interface InputProps {
    label: string;
    name: keyof Product;
    value: string | number;
    onChange: (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => void;
    type?: string;
    placeholder?: string;
    step?: string;
}

const InputField: React.FC<InputProps> = ({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder = "",
    step,
}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} *
        </label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
    </div>
);
