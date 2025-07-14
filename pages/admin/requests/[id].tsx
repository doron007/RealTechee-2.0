import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import RequestDetail from '../../../components/admin/requests/RequestDetail';
import { H1, P2 } from '../../../components/typography';

const RequestDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // Show loading state while router is not ready
  if (!router.isReady || !id || typeof id !== 'string') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <RequestDetail requestId={id} />
    </AdminLayout>
  );
};

export default RequestDetailPage;