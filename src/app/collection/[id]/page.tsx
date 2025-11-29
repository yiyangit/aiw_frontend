'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Grid, Header, Button, Segment, Loader, Message, Divider } from 'semantic-ui-react';
import { Problem } from '@/types';
import { getCollectionsWithProblems, getProblem } from '@/lib/api';
import Navbar from '@/components/Navbar';
import MarkdownRenderer from '@/components/MarkdownRenderer';

function CollectionProblemsContent() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<any>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (collectionId) {
      loadCollectionProblems();
    }
  }, [collectionId]);

  const loadCollectionProblems = async () => {
    try {
      setLoading(true);
      const collections = await getCollectionsWithProblems();
      const foundCollection = collections.find(c => c.id === collectionId);

      if (!foundCollection) {
        setError('找不到指定的习题集');
        setLoading(false);
        return;
      }

      setCollection(foundCollection);

      // 获取每个题目的详细信息
      if (foundCollection.problems && foundCollection.problems.length > 0) {
        const problemDetails = await Promise.all(
          foundCollection.problems.map(async (problem: Problem) => {
            return await getProblem(problem.id);
          })
        );
        setProblems(problemDetails);
      }
    } catch (err) {
      setError('加载题目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProblemClick = (problemId: string) => {
    // 保存当前collection ID到sessionStorage
    sessionStorage.setItem('collectionProblemId', collectionId);
    router.push(`/problem/${problemId}`);
  };

  const handleBack = () => {
    router.push('/collections');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container style={{ paddingTop: '6rem', paddingBottom: '2rem' }}>
          <Segment textAlign="center">
            <Loader active size="large">
              加载题目列表中...
            </Loader>
          </Segment>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container style={{ paddingTop: '6rem', paddingBottom: '2rem' }}>
          <Message negative>
            <Message.Header>加载失败</Message.Header>
            <p>{error}</p>
            <Button onClick={handleBack}>返回习题集列表</Button>
          </Message>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: '6rem', paddingBottom: '2rem' }}>
        <Grid stackable>
          <Grid.Row>
            <Grid.Column width="16">
              <Button basic onClick={handleBack} style={{ marginBottom: '1rem' }}>
                ← 返回习题集列表
              </Button>
            </Grid.Column>
          </Grid.Row>

          <Grid.Row>
            <Grid.Column width="16">
              <Header as="h2">
                {collection?.name || '习题集'}
                <Header.Subheader>
                  {collection?.description || '暂无描述'}
                </Header.Subheader>
                <Header.Subheader>
                  共 {problems.length} 道题目
                </Header.Subheader>
              </Header>
            </Grid.Column>
          </Grid.Row>

          <Grid.Row>
            <Grid.Column width="16">
              {problems.length === 0 ? (
                <Segment textAlign="center" placeholder>
                  <Header icon>
                    <i className="search icon"></i>
                    该习题集暂无题目
                  </Header>
                  <p>请联系管理员添加题目。</p>
                  <Button primary onClick={handleBack}>
                    返回习题集列表
                  </Button>
                </Segment>
              ) : (
                <div>
                  {problems.map((problem, index) => (
                    <div key={problem.id}>
                      <Segment
                        basic
                        onClick={() => handleProblemClick(problem.id)}
                        style={{ cursor: 'pointer', padding: '1.5rem 0' }}
                      >
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 'normal' }}>
                            题目 {index + 1}
                          </span>
                        </div>

                        <div style={{
                          maxHeight: '150px',
                          overflow: 'hidden',
                          fontSize: '1.05em',
                          lineHeight: '1.5'
                        }}>
                          <MarkdownRenderer
                            content={
                              problem.statement.length > 300
                                ? problem.statement.substring(0, 300) + '...'
                                : problem.statement
                            }
                          />
                        </div>
                      </Segment>
                      {index < problems.length - 1 && <Divider />}
                    </div>
                  ))}
                </div>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </>
  );
}

function CollectionProblemsLoadingFallback() {
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
      <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#333' }}>正在加载题目列表...</p>
    </div>
  );
}

export default function CollectionProblemsPage() {
  return (
    <Suspense fallback={<CollectionProblemsLoadingFallback />}>
      <CollectionProblemsContent />
    </Suspense>
  );
}
