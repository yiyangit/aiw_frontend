'use client';

import { Suspense, useEffect, useState } from 'react';
import { Container, Header, Segment, Card, Icon, Button, Message } from 'semantic-ui-react';
import { Collection, Category } from '@/types';
import { getCollectionsWithProblems, getCollectionsByCategoryWithProblems, getCategoryTree } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

function CollectionsContent() {
  const [isClient, setIsClient] = useState(false);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryIdParam = searchParams.get('category_id');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadCategories();
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && categories.length > 0) {
      loadCollections();
    }
  }, [isClient, categories, categoryIdParam]);

  const loadCategories = async () => {
    try {
      const data = await getCategoryTree();
      setCategories(data || []);

      // 根据URL参数查找当前分类
      if (categoryIdParam) {
        const found = findCategoryById(data, categoryIdParam);
        setCurrentCategory(found || null);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const findCategoryById = (categories: Category[], id: string): Category | null => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const loadCollections = async () => {
    setLoading(true);
    setError('');
    try {
      let data: Collection[] = [];

      if (currentCategory) {
        // 根据分类获取习题集
        data = await getCollectionsByCategoryWithProblems(currentCategory.id);
      } else {
        // 获取全部习题集
        data = await getCollectionsWithProblems();
      }

      setCollections(data || []);
    } catch (err: any) {
      setError('加载习题集失败：' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleShowAll = () => {
    setCurrentCategory(null);
    router.push('/collections');
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
          color: currentCategory
            ? '#f5576c'
            : '#667eea',
          textShadow: currentCategory
            ? '0 2px 4px rgba(245, 87, 108, 0.3)'
            : '0 2px 4px rgba(102, 126, 234, 0.3)'
        }}>
          <Icon name={currentCategory ? "folder open" : "folder open"} />
          {currentCategory ? `${currentCategory.name}习题集` : '习题集'}
        </Header>

        {error && (
          <Message negative style={{ marginBottom: '2rem' }}>
            <Message.Header>加载失败</Message.Header>
            <p>{error}</p>
          </Message>
        )}

        {currentCategory && !loading && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Button
              onClick={handleShowAll}
              basic
              color="blue"
              size="large"
            >
              <Icon name="list" />
              显示全部习题集
            </Button>
          </div>
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

export default function CollectionsPage() {
  return (
    <Suspense fallback={
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
    }>
      <CollectionsContent />
    </Suspense>
  );
}
