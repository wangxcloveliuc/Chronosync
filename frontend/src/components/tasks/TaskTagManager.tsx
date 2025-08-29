import React, { useState } from 'react';
import { TaskTag, CreateTaskTagData, UpdateTaskTagData } from '@/types';
import { useTasks } from '@/hooks/useTasks';

interface TaskTagManagerProps {
  onClose: () => void;
}

export const TaskTagManager: React.FC<TaskTagManagerProps> = ({ onClose }) => {
  const { tags, createTag, updateTag, deleteTag } = useTasks();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<TaskTag | null>(null);
  const [formData, setFormData] = useState<CreateTaskTagData>({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTag) {
        await updateTag(editingTag.id, formData);
        setEditingTag(null);
      } else {
        await createTag(formData);
        setIsCreating(false);
      }
      
      setFormData({ name: '', color: '#3B82F6', description: '' });
    } catch (error) {
      console.error('Error saving tag:', error);
    }
  };

  const handleEdit = (tag: TaskTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || '#3B82F6',
      description: tag.description || ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (tagId: number) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        await deleteTag(tagId);
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#3B82F6', description: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Manage Tags</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create New Tag
            </button>
          )}

          {isCreating && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingTag ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tags found. Create your first tag to get started!
              </div>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{tag.name}</div>
                      {tag.description && (
                        <div className="text-sm text-gray-500">{tag.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};