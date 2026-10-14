import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Briefcase } from 'lucide-react';
import { Address } from '../types';
import { useAuth } from '../context/AuthContext';

export const CustomerAddresses: React.FC = () => {
  const { token, user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 44444');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560038');
  const [label, setLabel] = useState<'home' | 'work' | 'other'>('home');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phone,
          street,
          apartment,
          city,
          state,
          postalCode,
          label,
          isDefault,
        }),
      });
      if (res.ok) {
        await fetchAddresses();
        setShowAddModal(false);
        setStreet('');
        setApartment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Saved Addresses</h1>
          <p className="text-xs text-slate-500 mt-1">Manage delivery locations for fast 1-click checkout.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm mb-1">No saved addresses</h3>
          <p className="text-xs text-slate-500 mb-4">Add your home or office address to speed up order deliveries.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-full"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-3xl border bg-white shadow-xs relative flex flex-col justify-between ${
                addr.isDefault ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {addr.label === 'work' ? <Briefcase className="w-4 h-4 text-slate-500" /> : <Home className="w-4 h-4 text-blue-600" />}
                    <span>{addr.fullName}</span>
                  </span>
                  {addr.isDefault && (
                    <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {addr.street}, {addr.apartment && `${addr.apartment}, `}{addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Phone: {addr.phone}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 capitalize">{addr.label} address</span>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-3">Add Delivery Address</h3>
            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="Plot/Flat, Building, Road name"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
