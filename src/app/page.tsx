'use client';

import { useEffect } from 'react';
import { Container, Header, Segment, Button, Icon } from 'semantic-ui-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: '3rem', paddingLeft: '0', paddingRight: '0', minHeight: 'calc(100vh - 60px)' }}>
        <Header as="h1" textAlign="center" style={{
          marginBottom: '4rem',
          fontSize: '3rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          Aihara Workbooks
        </Header>

        <Segment textAlign="center" style={{ padding: '4rem 2rem' }}>
          <Header as="h2" icon>
            <Header.Content>
              <span>{`Ciallo～(∠・ω< )⌒★`}</span>
              <Header.Subheader>
                更多功能敬请期待
              </Header.Subheader>
            </Header.Content>
          </Header>

          <div style={{ marginTop: '3rem' }}>
            <Button
              primary
              size="huge"
              onClick={() => router.push('/collections')}
              style={{
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '1.5rem 3rem',
                fontSize: '1.2rem',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              <Icon name="book" />
              浏览习题集
            </Button>
          </div>
        </Segment>
      </Container>
    </>
  );
}
