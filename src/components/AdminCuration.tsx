import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Check, Store } from 'lucide-react';
import { CuratedList, Vendor } from '../types';
import {
    getActiveCuratedLists,
    createCuratedList,
    updateCuratedList,
    deleteCuratedList
} from '../services/curation';
import { getProxiedImageUrl } from '../utils/imageUrl';

interface AdminCurationProps {
    vendors: Vendor[];
}

export const AdminCuration: React.FC<AdminCurationProps> = ({ vendors }) => {
    const [lists, setLists] = useState<CuratedList[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingList, setEditingList] = useState<Partial<CuratedList> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Load lists on mount
    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        setLoading(true);
        try {
            const data = await getActiveCuratedLists();
            setLists(data);
        } catch (error) {
            console.error('Failed to load lists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingList({
            title: '',
            description: '',
            category: 'all',
            type: 'top_3',
            vendorIds: [],
            active: true,
            order: lists.length
        });
    };

    const handleSave = async () => {
        if (!editingList || !editingList.title) return;

        try {
            if (editingList.id) {
                await updateCuratedList(editingList.id, editingList);
            } else {
                await createCuratedList(editingList as Omit<CuratedList, 'id' | 'createdAt' | 'updatedAt'>);
            }
            setEditingList(null);
            loadLists();
        } catch (error) {
            console.error('Failed to save list:', error);
            alert('Failed to save list');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this list?')) return;
        try {
            await deleteCuratedList(id);
            loadLists();
        } catch (error) {
            console.error('Failed to delete list:', error);
        }
    };

    const toggleVendor = (vendorId: string) => {
        if (!editingList) return;
        const currentIds = editingList.vendorIds || [];
        const newIds = currentIds.includes(vendorId)
            ? currentIds.filter(id => id !== vendorId)
            : [...currentIds, vendorId];

        setEditingList({ ...editingList, vendorIds: newIds });
    };

    // Filter vendors for selection (search by name only since category isn't on Vendor type)
    const filteredVendors = vendors.filter(v =>
        v.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading curation lists...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Curated Lists</h2>
                <button
                    onClick={handleCreate}
                    className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create New List</span>
                </button>
            </div>

            {/* List Editor Modal/Panel */}
            {editingList && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingList.id ? 'Edit List' : 'Create New List'}
                            </h3>
                            <button onClick={() => setEditingList(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editingList.title}
                                        onChange={e => setEditingList({ ...editingList, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="e.g. Top 3 Charger Vendors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={editingList.type}
                                        onChange={e => setEditingList({ ...editingList, type: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="top_3">Top 3 Ranking</option>
                                        <option value="featured">Featured Collection</option>
                                        <option value="certified">Certified Best</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={editingList.description}
                                        onChange={e => setEditingList({ ...editingList, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="e.g. Verified responsive vendors with best prices"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Filter</label>
                                    <input
                                        type="text"
                                        value={editingList.category}
                                        onChange={e => setEditingList({ ...editingList, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="e.g. electronics (optional)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        value={editingList.order}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setEditingList({ ...editingList, order: val === '' ? 0 : parseInt(val) });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Vendor Selection */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex justify-between items-center">
                                    <span>Select Vendors ({editingList.vendorIds?.length || 0})</span>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder="Search vendors..."
                                            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                                    {filteredVendors.map(vendor => {
                                        const isSelected = editingList.vendorIds?.includes(vendor.id);
                                        return (
                                            <div
                                                key={vendor.id}
                                                onClick={() => toggleVendor(vendor.id)}
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden mr-3">
                                                    {vendor.profileImage ? (
                                                        <img
                                                            src={getProxiedImageUrl(vendor.profileImage) || vendor.profileImage}
                                                            alt={vendor.businessName}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold">
                                                            {vendor.businessName.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {vendor.businessName}
                                                    </p>
                                                    {vendor.tagline && <p className="text-xs text-gray-500 truncate">{vendor.tagline}</p>}
                                                </div>
                                                {isSelected && (
                                                    <div className="ml-2 bg-emerald-500 text-white rounded-full p-0.5">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Click to select/deselect vendors. Selected vendors will be displayed in the list.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setEditingList(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists.map(list => (
                    <div key={list.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${list.type === 'top_3' ? 'bg-amber-100 text-amber-800' :
                                        list.type === 'certified' ? 'bg-blue-100 text-blue-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                        {list.type === 'top_3' ? '🏆 Top 3' : list.type === 'certified' ? '✅ Certified' : '✨ Featured'}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{list.title}</h3>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => setEditingList(list)}
                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(list.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                                {list.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                                <div className="flex items-center">
                                    <Store className="w-3 h-3 mr-1" />
                                    {list.vendorIds?.length || 0} Vendors
                                </div>
                                <div>
                                    Sort Order: {list.order}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {lists.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-2">No curated lists found.</p>
                        <button onClick={handleCreate} className="text-emerald-600 font-medium hover:underline">
                            Create your first curated list
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
