import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const SuccessStories = () => {
  const { user } = useContext(AuthContext);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedStories, setLikedStories] = useState(() => {
    const saved = localStorage.getItem('likedStories');
    return saved ? JSON.parse(saved) : {};
  });

  const [commentInputs, setCommentInputs] = useState({});
  const [guestNames, setGuestNames] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [showComments, setShowComments] = useState({});
  const [activeImage, setActiveImage] = useState(null);
  const [likeAnimations, setLikeAnimations] = useState({});

  useEffect(() => {
    fetchStories();
  }, []);

  // Lock scroll on lightbox
  useEffect(() => {
    if (activeImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeImage]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stories');
      setStories(response.data.stories || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load success stories.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (storyId) => {
    if (likedStories[storyId]) return;

    try {
      await api.post(`/stories/${storyId}/like`);
      const newLiked = { ...likedStories, [storyId]: true };
      setLikedStories(newLiked);
      localStorage.setItem('likedStories', JSON.stringify(newLiked));

      // Trigger pop animation
      setLikeAnimations(prev => ({ ...prev, [storyId]: true }));
      setTimeout(() => setLikeAnimations(prev => ({ ...prev, [storyId]: false })), 600);

      setStories(prev =>
        prev.map(s => s.id === storyId ? { ...s, likes_count: s.likes_count + 1 } : s)
      );
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleDoubleClickLike = (storyId) => {
    if (!likedStories[storyId]) {
      handleLike(storyId);
    }
  };

  const handleCommentSubmit = async (e, storyId) => {
    e.preventDefault();
    const commentText = commentInputs[storyId] || '';
    const guestName = guestNames[storyId] || '';

    if (!commentText.trim()) return;
    if (!user && !guestName.trim()) {
      toast.error('Please enter your name to comment.');
      return;
    }

    try {
      setSubmittingComment(prev => ({ ...prev, [storyId]: true }));
      const response = await api.post(`/stories/${storyId}/comments`, {
        comment_text: commentText,
        guest_name: user ? null : guestName
      });

      setStories(prev =>
        prev.map(story => {
          if (story.id === storyId) {
            return { ...story, comments: [...story.comments, response.data.comment] };
          }
          return story;
        })
      );

      setCommentInputs(prev => ({ ...prev, [storyId]: '' }));
      toast.success('Comment posted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [storyId]: false }));
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-400';
    const colors = [
      'bg-rose-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
      'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold animate-pulse">Loading Stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Lightbox */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
          style={{ animation: 'fadeIn 0.2s ease' }}
        >
          <button
            className="absolute top-5 right-6 text-white/70 hover:text-white text-3xl transition cursor-pointer z-10"
            onClick={() => setActiveImage(null)}
          >
            ✕
          </button>
          <img
            src={activeImage}
            alt="Full view"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleIn 0.25s ease' }}
          />
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-extrabold uppercase px-4 py-1.5 rounded-full tracking-wider mb-5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
            Verified Impact
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Success Stories
          </h1>
          <p className="mt-3 text-gray-500 text-base sm:text-lg font-medium max-w-lg mx-auto">
            Real proof of how your donations are making a difference. Every story is verified by our team.
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">
        {stories.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <span className="text-5xl block mb-4">📸</span>
            <h3 className="text-xl font-bold text-gray-900">No Stories Yet</h3>
            <p className="mt-2 text-gray-500 text-sm max-w-sm mx-auto">
              Our team will publish verified success reports of completed campaigns soon. Stay tuned!
            </p>
          </div>
        ) : (
          stories.map((story) => {
            const hasLiked = !!likedStories[story.id];
            const isDescExpanded = !!expandedDescriptions[story.id];
            const isCommentsOpen = !!showComments[story.id];
            const descLimit = 180;
            const isLongDesc = story.description.length > descLimit;

            return (
              <article
                key={story.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Post Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-emerald-100">
                      GH
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">GiveHope</h4>
                      <p className="text-[11px] text-gray-400 font-medium leading-tight">{formatTimeAgo(story.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase px-2 py-1 rounded-md border border-emerald-100">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                    Verified
                  </div>
                </div>

                {/* Cover Image */}
                {story.image_url && (
                  <div
                    className="relative w-full bg-gray-100 cursor-pointer overflow-hidden"
                    onDoubleClick={() => handleDoubleClickLike(story.id)}
                    onClick={() => setActiveImage(story.image_url)}
                  >
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className="w-full object-cover"
                      style={{ maxHeight: '520px' }}
                    />
                    {/* Double-tap heart animation overlay */}
                    {likeAnimations[story.id] && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span
                          className="text-white text-7xl drop-shadow-lg"
                          style={{
                            animation: 'heartPop 0.6s ease forwards',
                          }}
                        >
                          ❤️
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Bar */}
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(story.id)}
                      className="flex items-center gap-1 cursor-pointer focus:outline-none group transition"
                      title={hasLiked ? 'Already liked' : 'Like this story'}
                    >
                      {hasLiked ? (
                        <svg className="w-6 h-6 text-rose-500 transition-transform group-active:scale-90" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-700 hover:text-rose-500 transition group-active:scale-90" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                      )}
                    </button>

                    {/* Comment Toggle */}
                    <button
                      onClick={() => setShowComments(prev => ({ ...prev, [story.id]: !prev[story.id] }))}
                      className="flex items-center gap-1 cursor-pointer focus:outline-none group"
                    >
                      <svg className="w-6 h-6 text-gray-700 hover:text-gray-900 transition group-active:scale-90" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Likes Count */}
                <div className="px-4 pb-1">
                  <p className="text-sm font-extrabold text-gray-900">
                    {story.likes_count.toLocaleString()} {story.likes_count === 1 ? 'like' : 'likes'}
                  </p>
                </div>

                {/* Caption / Description */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    <span className="font-extrabold text-gray-900 mr-1.5">{story.title}</span>
                    {isDescExpanded || !isLongDesc
                      ? story.description
                      : `${story.description.substring(0, descLimit)}...`}
                    {isLongDesc && (
                      <button
                        onClick={() => setExpandedDescriptions(prev => ({ ...prev, [story.id]: !prev[story.id] }))}
                        className="text-gray-400 hover:text-gray-600 font-semibold ml-1 cursor-pointer text-xs"
                      >
                        {isDescExpanded ? 'less' : 'more'}
                      </button>
                    )}
                  </p>
                </div>

                {/* Comments Toggle Link */}
                {story.comments && story.comments.length > 0 && !isCommentsOpen && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => setShowComments(prev => ({ ...prev, [story.id]: true }))}
                      className="text-sm text-gray-400 font-semibold cursor-pointer hover:text-gray-500 transition"
                    >
                      View all {story.comments.length} comment{story.comments.length > 1 ? 's' : ''}
                    </button>
                  </div>
                )}

                {/* Expanded Comments Section */}
                {isCommentsOpen && (
                  <div className="px-4 pb-3 space-y-2 max-h-64 overflow-y-auto">
                    {story.comments && story.comments.length > 0 ? (
                      story.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${getAvatarColor(comment.author_name)} text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5`}>
                            {getInitials(comment.author_name)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">
                              <span className="font-extrabold mr-1.5">{comment.author_name}</span>
                              {comment.comment_text}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{formatTimeAgo(comment.created_at)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic py-2">No comments yet.</p>
                    )}
                  </div>
                )}

                {/* Add Comment Section */}
                <div className="px-4 py-3 border-t border-gray-100">
                  {!user && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-gray-400 font-semibold shrink-0">Comment as</span>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={guestNames[story.id] || ''}
                        onChange={(e) => setGuestNames(prev => ({ ...prev, [story.id]: e.target.value }))}
                        className="flex-grow text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium transition"
                      />
                    </div>
                  )}
                  <form onSubmit={(e) => handleCommentSubmit(e, story.id)} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${user ? 'bg-emerald-600' : 'bg-gray-300'} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>
                      {user ? getInitials(user.name) : '?'}
                    </div>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInputs[story.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [story.id]: e.target.value }))}
                      className="flex-grow text-sm px-0 py-1.5 border-0 focus:outline-none font-medium text-gray-800 placeholder-gray-400 bg-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(e, story.id);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!commentInputs[story.id]?.trim() || submittingComment[story.id]}
                      className="text-emerald-600 font-extrabold text-sm disabled:text-gray-300 transition cursor-pointer disabled:cursor-default hover:text-emerald-700"
                    >
                      {submittingComment[story.id] ? '...' : 'Post'}
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes heartPop {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; transform: scale(1.3); }
          60% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default SuccessStories;
