import { useNavigate } from 'react-router-dom';
import CreatePostForm from '../components/CreatePostForm';

function CreatePostPage() {
  const navigate = useNavigate();

  // This function will be called after a post is successfully created
  const handlePostCreated = () => {
    navigate('/'); // Redirect the user to the home feed
  };

  return (
    <div>
      <CreatePostForm onPostCreated={handlePostCreated} />
    </div>
  );
}

export default CreatePostPage;