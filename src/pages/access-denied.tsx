import { Link } from 'react-router-dom';
import { Button, Card, PageHeader } from '@/ui/components';

export function AccessDeniedPage() {
  return (
    <div className="standalone-page">
      <Card className="access-card">
        <PageHeader
          title="Access denied"
          description="You are signed in, but your account does not have permission to open that area."
        />
        <Button asChild>
          <Link to="/home">Return to home</Link>
        </Button>
      </Card>
    </div>
  );
}
