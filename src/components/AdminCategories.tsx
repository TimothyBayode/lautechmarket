import { useState, useEffect } from "react";
import { Trash2, Tag, X, ChevronRight, FolderPlus, Database } from "lucide-react";
import {
    fetchBuckets,
    addBucket,
    deleteBucket,
    fetchCategories,
    addCategory,
    deleteCategory,
    categoryExists,
    Bucket,
    Category
} from "../services/categories";
import { migrateToBuckets } from "../services/migration";
import { Product } from "../types";

interface AdminCategoriesProps {
    onClose?: () => void;
    allProducts?: Product[];
}

export function AdminCategories({ onClose, allProducts = [] }: AdminCategoriesProps) {
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [newBucketName, setNewBucketName] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");

    const [addingBucket, setAddingBucket] = useState(false);
    const [addingCategory, setAddingCategory] = useState(false);

    const [migrating, setMigrating] = useState(false);
    const [error, setError] = useState("");
    const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);

    // Load buckets on mount
    useEffect(() => {
        loadData();
    }, []);

    // Load categories when bucket changes
    useEffect(() => {
        if (selectedBucket) {
            loadCategories(selectedBucket.id);
        } else {
            setCategories([]);
        }
    }, [selectedBucket]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            setDiagnosticInfo(null);
            const data = await fetchBuckets();
            setBuckets(data);
            if (data.length > 0 && !selectedBucket) {
                setSelectedBucket(data[0]);
            }
        } catch (err: any) {
            console.error("Error loading buckets:", err);
            setError("Failed to load buckets. This usually means Firestore rules are blocking 'buckets'.");
            setDiagnosticInfo(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async (bucketId: string) => {
        try {
            setError("");
            setDiagnosticInfo(null);
            const data = await fetchCategories(bucketId);
            setCategories(data);
        } catch (err: any) {
            console.error("Error loading categories:", err);
            setDiagnosticInfo(err?.message || String(err));
        }
    };

    const handleAddBucket = async () => {
        if (!newBucketName.trim()) return;
        setAddingBucket(true);
        setError("");
        setDiagnosticInfo(null);
        try {
            const bucket = await addBucket(newBucketName);
            setBuckets(prev => [...prev, bucket].sort((a, b) => a.name.localeCompare(b.name)));
            setNewBucketName("");
            setSelectedBucket(bucket);
        } catch (err: any) {
            console.error("Add bucket error:", err);
            setError("Failed to add bucket");
            setDiagnosticInfo(err?.message || String(err));
        } finally {
            setAddingBucket(false);
        }
    };

    const handleDeleteBucket = async (bucket: Bucket) => {
        if (!window.confirm(`Delete bucket "${bucket.name}"? This will NOT delete subcategories but they will become orphan.`)) return;
        try {
            await deleteBucket(bucket.id);
            setBuckets(prev => prev.filter(b => b.id !== bucket.id));
            if (selectedBucket?.id === bucket.id) setSelectedBucket(null);
        } catch (err) {
            alert("Failed to delete bucket");
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !selectedBucket) return;
        setAddingCategory(true);
        setError("");
        try {
            const exists = await categoryExists(newCategoryName, selectedBucket.id);
            if (exists) {
                setError("Category already exists in this bucket");
                return;
            }
            const cat = await addCategory(newCategoryName, selectedBucket.id);
            setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
            setNewCategoryName("");
        } catch (err) {
            setError("Failed to add category");
        } finally {
            setAddingCategory(false);
        }
    };

    const handleDeleteCategory = async (cat: Category) => {
        if (!window.confirm(`Delete "${cat.name}"?`)) return;
        try {
            await deleteCategory(cat.id);
            setCategories(prev => prev.filter(c => c.id !== cat.id));
        } catch (err) {
            alert("Failed to delete category");
        }
    };

    const handleRunMigration = async () => {
        if (!window.confirm("This will migrate existing flat categories to the hierarchical structure. Continue?")) return;
        setMigrating(true);
        try {
            const result = await migrateToBuckets();
            alert(`Migration Report:\n
✅ Success: ${result.success}
📦 Categories Updated: ${result.movedCategories}
🛍️ Products Updated: ${result.updatedProducts}
🆕 Buckets Created: ${result.createdBuckets}
⚠️ Unsorted Categories: ${result.unsortedCategories}`);
            loadData();
        } catch (err) {
            alert("Migration failed");
        } finally {
            setMigrating(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading management portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-600 p-6 flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">Category Buckets</h3>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Manage Store Hierarchy</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleRunMigration}
                        disabled={migrating}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-black uppercase"
                        title="Migrate old data"
                    >
                        <Database className="w-4 h-4" />
                        <span>{migrating ? "Migrating..." : "Migrate Old Data"}</span>
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row min-h-[500px]">
                {/* Buckets Sidebar */}
                <div className="w-full md:w-72 border-r border-gray-100 bg-gray-50/50 p-6">
                    <div className="mb-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Main Buckets</h4>
                        <div className="space-y-2">
                            {buckets.map(bucket => (
                                <div
                                    key={bucket.id}
                                    onClick={() => setSelectedBucket(bucket)}
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedBucket?.id === bucket.id
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100"
                                        : "bg-white text-gray-700 border-transparent hover:border-emerald-200 hover:bg-emerald-50"
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[9px] font-black italic ${selectedBucket?.id === bucket.id ? "text-emerald-100" : "text-gray-400"}`}>
                                                {allProducts.filter(p => p.bucketId === bucket.id).length} items
                                            </span>
                                            <span className="font-bold text-sm tracking-tight">{bucket.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteBucket(bucket); }}
                                                className={`p-1 rounded-lg transition-colors ${selectedBucket?.id === bucket.id ? "hover:bg-white/20" : "hover:bg-red-50 text-gray-400 hover:text-red-500"}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <ChevronRight className={`w-4 h-4 ${selectedBucket?.id === bucket.id ? "text-white" : "text-gray-300"}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Add Bucket</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={newBucketName}
                                onChange={(e) => setNewBucketName(e.target.value)}
                                placeholder="New Bucket..."
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                            <button
                                onClick={handleAddBucket}
                                disabled={addingBucket || !newBucketName.trim()}
                                className="absolute right-2 top-1.5 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-200 transition-colors"
                            >
                                <FolderPlus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subcategories Area */}
                <div className="flex-1 p-8">
                    {/* Error Display for overall component */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-in shake duration-300">
                            <p className="text-red-700 text-sm font-bold flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                {error}
                            </p>
                            {diagnosticInfo && (
                                <div className="p-3 bg-red-100/50 rounded-lg mb-3">
                                    <p className="text-[10px] font-mono text-red-600 break-all">
                                        RAW ERROR: {diagnosticInfo}
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={loadData}
                                className="px-4 py-2 bg-red-600 text-white text-xs font-black uppercase rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Retry Connection
                            </button>
                        </div>
                    )}

                    {selectedBucket ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-2xl font-black text-gray-900">{selectedBucket.name}</h4>
                                    <p className="text-gray-500 text-sm font-medium">Manage subcategories within this bucket</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-emerald-100 text-emerald-700 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                                        {categories.length} Subcategories
                                    </span>
                                </div>
                            </div>

                            {/* Add Category */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Add Subcategory to {selectedBucket.name}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => { setNewCategoryName(e.target.value); setError(""); }}
                                        placeholder="e.g. Barbing, Laundry, Laptops..."
                                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                                    />
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={addingCategory || !newCategoryName.trim()}
                                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all font-black text-xs uppercase shadow-lg shadow-emerald-100 disabled:opacity-50"
                                    >
                                        {addingCategory ? "Adding..." : "Add"}
                                    </button>
                                </div>
                            </div>

                            {/* Categories Grid */}
                            {categories.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Tag className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-gray-400 font-bold">No subcategories in this bucket yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {categories.map(cat => {
                                        const itemCount = allProducts.filter(p => p.category === cat.name).length;
                                        return (
                                            <div
                                                key={cat.id}
                                                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all shadow-sm"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-700">{cat.name}</span>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase italic">{itemCount} items listed</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                            <Database className="w-16 h-16 text-gray-200 mb-4" />
                            <h4 className="text-xl font-bold text-gray-400">Select a bucket to manage its contents</h4>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">Pick a bucket from the sidebar or create a new one to start organizing.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
