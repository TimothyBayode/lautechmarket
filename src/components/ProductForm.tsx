import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Product } from "../types";
import {
  fetchCategories,
  addCategory,
  categoryExists,
} from "../services/categories";

interface ProductFormProps {
  product: Product | null;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    id: "",
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    inStock: true,
    whatsappNumber: "",
    vendorName: "",
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [product, categories]);

  const loadCategories = async () => {
    try {
      const categoriesData = await fetchCategories();
      const categoryNames = categoriesData.map((cat) => cat.name);
      setCategories(categoryNames);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name === "category" && value === "add-new") {
      setShowNewCategoryInput(true);
      setFormData((prev) => ({ ...prev, category: "" }));
      setError("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? parseFloat(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(e.target.value);
    setError("");
  };

  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) {
      setError("Category name cannot be empty");
      return;
    }

    try {
      const exists = await categoryExists(newCategory);
      if (exists) {
        setError("Category already exists");
        return;
      }

      await addCategory(newCategory);

      await loadCategories();

      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setShowNewCategoryInput(false);
      setNewCategory("");
      setError("");
    } catch (err) {
      console.error("Failed to add category:", err);
      setError("Failed to add category");
    }
  };

  const handleCancelNewCategory = () => {
    setShowNewCategoryInput(false);
    setNewCategory("");
    setError("");
    setFormData((prev) => ({
      ...prev,
      category: categories.length > 0 ? categories[0] : "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      setError("Please select a category");
      return;
    }
    setError("");
    onSave(formData);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {product ? "Edit Product" : "Add New Product"}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <InputField
            label="Price (₦)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            {showNewCategoryInput ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={handleNewCategoryChange}
                  placeholder="Enter new category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    disabled={!newCategory.trim()}
                    className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelNewCategory}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : categories.length > 0 ? (
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option
                  value="add-new"
                  className="text-emerald-600 font-medium"
                >
                  + Add New Category
                </option>
              </select>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  No categories found. Add the first one!
                </p>
                <input
                  type="text"
                  value={newCategory}
                  onChange={handleNewCategoryChange}
                  placeholder="Enter category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  disabled={!newCategory.trim()}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Add Category
                </button>
              </div>
            )}
          </div>

          <InputField
            label="Vendor Name"
            name="vendorName"
            value={formData.vendorName}
            onChange={handleChange}
          />
          <InputField
            label="WhatsApp Number"
            name="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={handleChange}
            placeholder="+1234567890"
          />
          <InputField
            label="Image URL"
            name="image"
            type="url"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
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
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
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
