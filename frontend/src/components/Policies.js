import React, { useState, useEffect } from 'react';
import { policyAPI } from '../utils/api';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Policies() {
  const [policies, setPolicies] = useState({
    blocked_sites: [],
    allowed_sites: {},
    controlled_sites: [],
    daily_time_limit: 3600,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlockedSite, setNewBlockedSite] = useState('');
  const [newAllowedSite, setNewAllowedSite] = useState({ name: '', url: '' });
  const [newControlledSite, setNewControlledSite] = useState('');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await policyAPI.get();
      setPolicies(response.data.policy);
    } catch (error) {
      console.error('Error loading policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const savePolicies = async () => {
    setSaving(true);
    try {
      await policyAPI.update(policies);
      toast.success('Policies updated successfully');
    } catch (error) {
      console.error('Error saving policies:', error);
      toast.error('Failed to save policies');
    } finally {
      setSaving(false);
    }
  };

  const addBlockedSite = () => {
    if (newBlockedSite.trim() && !policies.blocked_sites.includes(newBlockedSite.trim())) {
      setPolicies({
        ...policies,
        blocked_sites: [...policies.blocked_sites, newBlockedSite.trim()],
      });
      setNewBlockedSite('');
    }
  };

  const removeBlockedSite = (site) => {
    setPolicies({
      ...policies,
      blocked_sites: policies.blocked_sites.filter(s => s !== site),
    });
  };

  const addAllowedSite = () => {
    if (newAllowedSite.name.trim() && newAllowedSite.url.trim()) {
      setPolicies({
        ...policies,
        allowed_sites: {
          ...policies.allowed_sites,
          [newAllowedSite.name.trim()]: newAllowedSite.url.trim(),
        },
      });
      setNewAllowedSite({ name: '', url: '' });
    }
  };

  const removeAllowedSite = (name) => {
    const newAllowedSites = { ...policies.allowed_sites };
    delete newAllowedSites[name];
    setPolicies({
      ...policies,
      allowed_sites: newAllowedSites,
    });
  };

  const addControlledSite = () => {
    if (newControlledSite.trim() && !policies.controlled_sites.includes(newControlledSite.trim())) {
      setPolicies({
        ...policies,
        controlled_sites: [...policies.controlled_sites, newControlledSite.trim()],
      });
      setNewControlledSite('');
    }
  };

  const removeControlledSite = (site) => {
    setPolicies({
      ...policies,
      controlled_sites: policies.controlled_sites.filter(s => s !== site),
    });
  };

  const handleTimeLimitChange = (e) => {
    const hours = parseInt(e.target.value);
    setPolicies({
      ...policies,
      daily_time_limit: hours * 3600, // Convert hours to seconds
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-butterfly-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Browsing Policies</h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            Configure what websites your students can access and set time limits.
          </p>
        </div>
        <button
          onClick={savePolicies}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Time Limit */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Time Limit</h3>
        <div className="max-w-xs">
          <label htmlFor="timeLimit" className="label">
            Hours per day for controlled sites
          </label>
          <select
            id="timeLimit"
            className="input-field"
            value={Math.floor(policies.daily_time_limit / 3600)}
            onChange={handleTimeLimitChange}
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={3}>3 hours</option>
            <option value={4}>4 hours</option>
            <option value={6}>6 hours</option>
            <option value={8}>8 hours</option>
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Students can spend this much time on controlled sites per day.
          </p>
        </div>
      </div>

      {/* Blocked Sites */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Blocked Sites</h3>
        <p className="text-sm text-gray-500 mb-4">
          These websites will be completely blocked for students.
        </p>
        
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Enter domain (e.g., facebook.com)"
            className="input-field flex-1"
            value={newBlockedSite}
            onChange={(e) => setNewBlockedSite(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addBlockedSite()}
          />
          <button onClick={addBlockedSite} className="btn-primary">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {policies.blocked_sites.map((site, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm font-medium text-red-800">{site}</span>
              <button
                onClick={() => removeBlockedSite(site)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {policies.blocked_sites.length === 0 && (
            <p className="text-sm text-gray-500 italic">No blocked sites configured.</p>
          )}
        </div>
      </div>

      {/* Allowed Sites */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Sites</h3>
        <p className="text-sm text-gray-500 mb-4">
          These educational websites will be prominently displayed and always accessible.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <input
            type="text"
            placeholder="Site name (e.g., Khan Academy)"
            className="input-field"
            value={newAllowedSite.name}
            onChange={(e) => setNewAllowedSite({ ...newAllowedSite, name: e.target.value })}
          />
          <div className="flex space-x-2">
            <input
              type="url"
              placeholder="https://www.example.com"
              className="input-field flex-1"
              value={newAllowedSite.url}
              onChange={(e) => setNewAllowedSite({ ...newAllowedSite, url: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && addAllowedSite()}
            />
            <button onClick={addAllowedSite} className="btn-primary">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(policies.allowed_sites).map(([name, url]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <span className="text-sm font-medium text-green-800">{name}</span>
                <p className="text-xs text-green-600">{url}</p>
              </div>
              <button
                onClick={() => removeAllowedSite(name)}
                className="text-green-600 hover:text-green-800 p-1"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {Object.keys(policies.allowed_sites).length === 0 && (
            <p className="text-sm text-gray-500 italic">No recommended sites configured.</p>
          )}
        </div>
      </div>

      {/* Controlled Sites */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Time-Controlled Sites</h3>
        <p className="text-sm text-gray-500 mb-4">
          These sites are allowed but count towards the daily time limit.
        </p>
        
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Enter domain (e.g., youtube.com)"
            className="input-field flex-1"
            value={newControlledSite}
            onChange={(e) => setNewControlledSite(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addControlledSite()}
          />
          <button onClick={addControlledSite} className="btn-primary">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {policies.controlled_sites.map((site, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-sm font-medium text-yellow-800">{site}</span>
              <button
                onClick={() => removeControlledSite(site)}
                className="text-yellow-600 hover:text-yellow-800 p-1"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {policies.controlled_sites.length === 0 && (
            <p className="text-sm text-gray-500 italic">No controlled sites configured.</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePolicies}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
