import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Package,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Product, CategoryStats } from "../types";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../services/products";
import { ProductForm } from "../components/ProductForm";
import { authStateListener, logoutUser } from "../services/auth";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = authStateListener((user) => {
      console.log("Auth state changed in dashboard:", user);
      if (!user) {
        navigate("/admin/login");
        return;
      }
      setAuthChecked(true);
      loadProductData();
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data as Product[]);
      calculateStats(data as Product[]);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Product[]) => {
    const categories = [...new Set(data.map((p) => p.category))];
    const stats = categories.map((category) => {
      const categoryProducts = data.filter((p) => p.category === category);
      return {
        category,
        count: categoryProducts.length,
        inStock: categoryProducts.filter((p) => p.inStock).length,
        outOfStock: categoryProducts.filter((p) => !p.inStock).length,
      };
    });
    setCategoryStats(stats);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSave = async (product: Product) => {
    try {
      let updatedProducts: Product[] = [];

      if (editingProduct) {
        await updateProduct(product.id, product);
        updatedProducts = products.map((p) =>
          p.id === product.id ? product : p
        );
      } else {
        const newProduct = await addProduct(product);
        updatedProducts = [...products, newProduct];
      }

      setProducts(updatedProducts);
      calculateStats(updatedProducts);
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setShowForm(false);
      setEditingProduct(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await deleteProduct(id);
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      calculateStats(updated);
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length)
      setSelectedProducts(new Set());
    else setSelectedProducts(new Set(products.map((p) => p.id)));
  };

  const handleBulkMarkOutOfStock = async () => {
    const updatedProducts = products.map((p) =>
      selectedProducts.has(p.id) ? { ...p, inStock: false } : p
    );
    for (const p of updatedProducts.filter((p) => selectedProducts.has(p.id))) {
      await updateProduct(p.id, p);
    }
    setProducts(updatedProducts);
    calculateStats(updatedProducts);
    setSelectedProducts(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Delete ${selectedProducts.size} selected products?`))
      return;

    for (const id of selectedProducts) {
      await deleteProduct(id);
    }
    const updated = products.filter((p) => !selectedProducts.has(p.id));
    setProducts(updated);
    calculateStats(updated);
    setSelectedProducts(new Set());
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900">
                {products.length}
              </span>
            </div>
            <p className="text-gray-600">Total Products</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">
                {products.filter((p) => p.inStock).length}
              </span>
            </div>
            <p className="text-gray-600">In Stock</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">
                {products.filter((p) => !p.inStock).length}
              </span>
            </div>
            <p className="text-gray-600">Out of Stock</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                {categoryStats.length}
              </span>
            </div>
            <p className="text-gray-600">Categories</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Category Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryStats.map((stat) => (
              <div
                key={stat.category}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {stat.category}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Total: <span className="font-semibold">{stat.count}</span>
                  </p>
                  <p className="text-green-600">
                    In Stock:{" "}
                    <span className="font-semibold">{stat.inStock}</span>
                  </p>
                  <p className="text-red-600">
                    Out of Stock:{" "}
                    <span className="font-semibold">{stat.outOfStock}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>

            {selectedProducts.size > 0 && (
              <>
                <button
                  onClick={handleBulkMarkOutOfStock}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Mark Out of Stock ({selectedProducts.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete ({selectedProducts.size})
                </button>
              </>
            )}
          </div>

          <p className="text-sm text-gray-600">
            {selectedProducts.size} of {products.length} selected
          </p>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ProductForm
                product={editingProduct}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.size === products.length &&
                        products.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₦{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.inStock
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.vendorName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
