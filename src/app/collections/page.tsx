'use client';

import { useEffect, useState } from 'react';
import { Container, Header, Segment, Card, Icon, Button, Message } from 'semantic-ui-react';
import { Collection } from '@/types';
import { getCollectionsWithProblems } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function CollectionsPage() {
  const [isClient, setIsClient] = useState(false);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadCollections();
    }
  }, [isClient]);

  const loadCollections = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCollectionsWithProblems();
      setCollections(data || []);
    } catch (err: any) {
      setError('加载习题集失败：' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = (collectionId: string) => {
    // 跳转到习题集的题目列表页面
    router.push(`/collection/${collectionId}`);
  };

  // 如果还没到客户端，返回加载状态
  if (!isClient) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0', padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #e0e0e0',
          borderTop: '5px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#333' }}>正在加载习题集...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: '3rem', minHeight: 'calc(100vh - 60px)' }}>
        <Header as="h1" textAlign="center" style={{
          marginBottom: '3rem',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Icon name="folder open" />
          习题集
        </Header>

        {error && (
          <Message negative style={{ marginBottom: '2rem' }}>
            <Message.Header>加载失败</Message.Header>
            <p>{error}</p>
          </Message>
        )}

        {!loading && collections && collections.length === 0 && (
          <Segment textAlign="center" style={{ padding: '4rem 2rem' }}>
            <Icon name="info circle" size="massive" color="grey" />
            <Header as="h2" color="grey">
              还没有习题集
            </Header>
            <p style={{ color: '#666', marginTop: '1rem' }}>
              请前往管理后台创建习题集
            </p>
          </Segment>
        )}

        {collections && collections.length > 0 && (
          <Card.Group itemsPerRow={3} stackable>
            {collections.map((collection) => (
              <Card key={collection.id} centered>
                <Card.Content>
                  <Card.Header>
                    <Icon name="folder open" />
                    {collection.name}
                  </Card.Header>
                  <Card.Meta>
                    <Icon name="file text" />
                    {collection.problems?.length || 0} 道题目
                  </Card.Meta>
                  <Card.Description style={{ marginTop: '1rem' }}>
                    {collection.description || '暂无描述'}
                  </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <div className="ui two buttons">
                    <Button
                      basic
                      color="blue"
                      onClick={() => handleStartPractice(collection.id)}
                      disabled={!collection.problems || collection.problems.length === 0}
                    >
                      <Icon name="play" />
                      开始练习
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
        )}

        {loading && (
          <Segment textAlign="center" style={{ padding: '4rem 2rem' }}>
            <Icon loading name="spinner" size="massive" />
            <Header as="h2" color="grey">
              正在加载习题集...
            </Header>
          </Segment>
        )}
      </Container>
    </>
  );
}
