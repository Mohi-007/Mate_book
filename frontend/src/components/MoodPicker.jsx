import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🔥', label: 'Motivated' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '🥳', label: 'Excited' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '💪', label: 'Strong' },
];

export default function MoodPicker() {
  const { user, updateUser } = useAuth();

  const selectMood = async (emoji) => {
    try {
      const res = await authAPI.updateMood(emoji);
      updateUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3 className="mb-sm">🎯 How are you feeling?</h3>
      <div className="mood-picker">
        {MOODS.map(({ emoji, label }) => (
          <button
            key={label}
            className={`mood-btn ${user?.mood === emoji ? 'active' : ''}`}
            onClick={() => selectMood(emoji)}
            title={label}
          >
            <span>{emoji}</span>
            <span className="mood-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
