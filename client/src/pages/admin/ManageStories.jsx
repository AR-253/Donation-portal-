import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';

const ITEMS_PER_PAGE = 10;

const AdminManageStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [activeStoryForComments, setActiveStoryForComments] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  // Lock background scroll when any modal is open
  useEffect(() => {
    if (isFormModalOpen || isCommentsModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormModalOpen, isCommentsModalOpen]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stories');
      setStories(response.data.stories || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Failed to fetch success stories list.');
      toast.error('Failed to load stories.');
    } finally {
      setLoading(false);
    }
  };

  // --- Filtered & Paginated Data ---
  const filteredStories = stories.filter(story => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      story.title.toLowerCase().includes(q) ||
      story.description.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredStories.length / ITEMS_PER_PAGE);
  const paginatedStories = filteredStories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- Modal Handlers ---
  const openCreateModal = () => {
    setEditingStory(null);
    setFormData({ title: '', description: '', image_url: '' });
    setIsFormModalOpen(true);
  };

  const openEditModal = (story) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      description: story.description,
      image_url: story.image_url,
    });
    setIsFormModalOpen(true);
  };

  const openCommentsModal = (story) => {
    setActiveStoryForComments(story);
    setIsCommentsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await api.post('/admin/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, image_url: response.data.imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (!formData.title || !formData.description) {
      toast.error('Please enter a title and description.');
      setFormLoading(false);
      return;
    }

    try {
      if (editingStory) {
        await api.put(`/stories/${editingStory.id}`, formData);
        toast.success('Success story updated!');
      } else {
        await api.post('/stories', formData);
        toast.success('Success story created!');
      }
      setIsFormModalOpen(false);
      fetchStories();
    } catch (err) {
      console.error('Submit story error:', err);
      toast.error(err.response?.data?.message || 'Error processing request.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStory = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this success story and all of its comments?')) {
      return;
    }
    try {
      await api.delete(`/stories/${id}`);
      toast.success('Story deleted successfully!');
      fetchStories();
    } catch (err) {
      console.error('Delete story error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete story.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/stories/comments/${commentId}`);
      toast.success('Comment deleted.');
      setActiveStoryForComments(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      }));
      setStories(prevStories =>
        prevStories.map(story => {
          if (story.id === activeStoryForComments.id) {
            return { ...story, comments: story.comments.filter(c => c.id !== commentId) };
          }
          return story;
        })
      );
    } catch (err) {
      console.error('Delete comment error:', err);
      toast.error('Failed to delete comment.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manage Stories</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Publish visual proof and success details of completed campaigns.
              <span className="ml-2 font-bold text-emerald-600">{stories.length} total</span>
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
          >
            <span className="text-lg leading-none">+</span> Create Story
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search stories by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-medium bg-gray-50/50 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-2xl">
            {error}
            <button onClick={fetchStories} className="ml-4 underline font-bold text-red-700 hover:text-red-900 cursor-pointer">Retry</button>
          </div>
        )}

        {/* Stories Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs w-12">#</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Image</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Title</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Published</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs text-center">Likes</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs text-center">Comments</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-semibold text-xs animate-pulse">Loading stories...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedStories.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl mb-3">📸</span>
                        <p className="text-gray-400 font-semibold text-sm">
                          {searchQuery ? 'No stories match your search.' : 'No success stories published yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStories.map((story, index) => (
                    <tr key={story.id} className="hover:bg-gray-50/50 transition group">
                      {/* Row Number */}
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      {/* Thumbnail */}
                      <td className="px-5 py-3">
                        {story.image_url ? (
                          <img 
                            src={story.image_url} 
                            alt={story.title} 
                            className="w-14 h-10 object-cover rounded-lg border border-gray-100 shadow-2xs"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs border border-gray-100">
                            📷
                          </div>
                        )}
                      </td>
                      {/* Title & Description Snippet */}
                      <td className="px-5 py-3 max-w-xs">
                        <p className="font-bold text-gray-900 text-sm truncate">{story.title}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5 max-w-[280px]">{story.description}</p>
                      </td>
                      {/* Date */}
                      <td className="px-5 py-3 text-gray-500 text-xs font-medium whitespace-nowrap">
                        {formatDate(story.created_at)}
                      </td>
                      {/* Likes */}
                      <td className="px-5 py-3 text-center">
                        <span className="bg-rose-50 text-rose-600 text-xs font-extrabold px-2.5 py-1 rounded-full border border-rose-100">
                          ❤️ {story.likes_count}
                        </span>
                      </td>
                      {/* Comments */}
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => openCommentsModal(story)}
                          className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100 transition cursor-pointer"
                          title="Moderate comments"
                        >
                          💬 {story.comments ? story.comments.length : 0}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(story)}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold transition cursor-pointer border border-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer border border-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && filteredStories.length > ITEMS_PER_PAGE && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–
                <span className="font-bold text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStories.length)}</span> of{' '}
                <span className="font-bold text-gray-700">{filteredStories.length}</span> stories
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Form Modal */}
        {isFormModalOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsFormModalOpen(false)}
          >
            <div 
              className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-black text-gray-900">
                  {editingStory ? 'Edit Success Story' : 'Create Success Story'}
                </h2>
                <button 
                  onClick={() => setIsFormModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 font-light text-2xl transition cursor-pointer focus:outline-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Story Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Clean Water Project Completed"
                    className="w-full px-4 py-2.5 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-semibold shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Provide detailed description and outcomes..."
                    rows="5"
                    className="w-full px-4 py-2.5 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-medium shadow-2xs resize-none"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Upload Photo (Proof)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:transition file:cursor-pointer flex-grow border border-gray-200 rounded-xl p-1 shadow-2xs bg-white"
                    />
                    {imageUploading && (
                      <span className="text-xs font-bold text-emerald-600 animate-pulse shrink-0">Uploading...</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Or Direct Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleFormChange}
                    placeholder="http://example.com/image.jpg"
                    className="w-full px-4 py-2.5 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-medium shadow-2xs"
                  />
                </div>

                {/* Image Preview */}
                {formData.image_url && (
                  <div className="rounded-xl overflow-hidden border border-gray-100 shadow-xs">
                    <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover" />
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || imageUploading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                  >
                    {formLoading ? 'Saving...' : editingStory ? 'Update Story' : 'Publish Story'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Moderate Comments Modal */}
        {isCommentsModalOpen && activeStoryForComments && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsCommentsModalOpen(false)}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Moderate Comments</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1 truncate max-w-lg">
                    Story: "{activeStoryForComments.title}" • <span className="font-bold text-emerald-600">{activeStoryForComments.comments?.length || 0} comments</span>
                  </p>
                </div>
                <button 
                  onClick={() => setIsCommentsModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 font-light text-2xl transition cursor-pointer focus:outline-none"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3 flex-grow bg-gray-50/50">
                {activeStoryForComments.comments && activeStoryForComments.comments.length > 0 ? (
                  activeStoryForComments.comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="flex justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-gray-800 text-sm">{comment.author_name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{formatDateTime(comment.created_at)}</span>
                          {comment.user_id ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-emerald-100">Registered</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-gray-200">Guest</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.comment_text}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition self-start cursor-pointer shrink-0"
                        title="Delete comment"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <span className="text-3xl block mb-3">💬</span>
                    <p className="font-semibold text-sm">No comments on this story yet.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white flex justify-end shrink-0">
                <button
                  onClick={() => setIsCommentsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminManageStories;
