/**
 * AdminCategories Component
 * 
 * Admin panel for managing product categories.
 * Allows adding and removing categories that vendors can select.
 */

import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, X } from "lucide-react";
import {
    fetchCategories,
    addCategory,
    deleteCategory,
    categoryExists,
    Category
} from "../services/categories";

interface AdminCategoriesProps {
    onClose?: () => void;
}

export function AdminCategories({ onClose }: AdminCategoriesProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (err) {
            console.error("Error loading categories:", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle add category
    const handleAdd = async () => {
        if (!newCategoryName.trim()) {
            setError("Please enter a category name");
            return;
        }

        setAdding(true);
        setError("");

        try {
            // Check if category exists
            const exists = await categoryExists(newCategoryName);
            if (exists) {
                setError("This category already exists");
                setAdding(false);
                return;
            }

            const newCategory = await addCategory(newCategoryName);
            setCategories((prev) => [...prev, newCategory].sort((a, b) =>
                a.name.localeCompare(b.name)
            ));
            setNewCategoryName("");
        } catch (err) {
            console.error("Error adding category:", err);
            setError("Failed to add category");
        } finally {
            setAdding(false);
        }
    };

    // Handle delete category
    const handleDelete = async (categoryId: string, categoryName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${categoryName}"? Products with this category will keep their current category.`)) {
            return;
        }

        try {
            await deleteCategory(categoryId);
            setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        } catch (err) {
            console.error("Error deleting category:", err);
            alert("Failed to delete category");
        }
    };

    // Handle enter key in input
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !adding) {
            handleAdd();
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-emerald-600 font-bold" />
                    <h3 className="text-lg font-bold text-gray-900">
                        Categories ({categories.length})
                    </h3>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="p-4">
                {/* Add Category Form */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Add New Category
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => {
                                setNewCategoryName(e.target.value);
                                setError("");
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="e.g. Electronics, Fashion..."
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={adding || !newCategoryName.trim()}
                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{adding ? "Adding..." : "Add"}</span>
                        </button>
                    </div>
                    {error && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
                    )}
                </div>

                {/* Categories List */}
                {categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No categories yet. Add your first category above!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-500 mb-3">
                            These categories are available for vendors when adding products:
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="group flex items-center bg-white border border-gray-200 rounded-xl pl-4 pr-2 py-2.5 hover:border-emerald-300 hover:shadow-sm transition-all shadow-sm"
                                >
                                    <span className="text-sm font-bold text-gray-700 mr-2">
                                        {category.name}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(category.id, category.name)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete category"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Deleting a category won't affect existing products.
                        They will keep their current category until edited.
                    </p>
                </div>
            </div>
        </div>
    );
}
