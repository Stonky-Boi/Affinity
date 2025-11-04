import { useNavigate } from 'react-router-dom';
import CreatePostForm from '../components/CreatePostForm';

function CreatePostPage() {
  const navigate = useNavigate();

  const handlePostCreated = () => {
    navigate('/');
  };

  return (
    <div>
      <CreatePostForm onPostCreated={handlePostCreated} />
    </div>
  );
}

export default CreatePostPage;