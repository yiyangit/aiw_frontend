'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Grid, Header, Segment, Button, Icon, Accordion, Message, Loader, Modal } from 'semantic-ui-react';
import { Problem } from '@/types';
import { getProblem, deleteProblem } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChatInterface from '@/components/ChatInterface';

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const { isAuthenticated } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (problemId) {
      loadProblem();
    }
  }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      const data = await getProblem(problemId);
      setProblem(data);
    } catch (err) {
      setError('加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteProblem(problemId);
      setDeleteModalOpen(false);
      // 删除成功，返回之前的页面
      const collectionId = sessionStorage.getItem('collectionProblemId');
      if (collectionId) {
        sessionStorage.removeItem('collectionProblemId');
        router.push(`/collection/${collectionId}`);
        return;
      }

      // 否则从科目题目列表返回
      const queryParams = sessionStorage.getItem('problemListQuery');
      if (queryParams) {
        sessionStorage.removeItem('problemListQuery');
        router.push(`/problems?${queryParams}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError('删除题目失败: ' + (err.message || '未知错误'));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Container style={{ padding: '2rem 0' }}>
        <Segment textAlign="center">
          <Loader active size="large">
            加载题目中...
          </Loader>
        </Segment>
      </Container>
    );
  }

  if (error || !problem) {
    return (
      <Container style={{ padding: '2rem 0' }}>
        <Message negative>
          <Message.Header>加载失败</Message.Header>
          <p>{error || '题目不存在'}</p>
          <Button onClick={() => router.push('/')}>返回首页</Button>
        </Message>
      </Container>
    );
  }

  return (
    <Container style={{ padding: '2rem 0' }}>
      <Grid stackable>
        <Grid.Row>
          <Grid.Column width="16">
            <Button
              basic
              onClick={() => {
                // 优先从习题集返回
                const collectionId = sessionStorage.getItem('collectionProblemId');
                if (collectionId) {
                  sessionStorage.removeItem('collectionProblemId');
                  router.push(`/collection/${collectionId}`);
                  return;
                }

                // 否则从科目题目列表返回
                const queryParams = sessionStorage.getItem('problemListQuery');
                if (queryParams) {
                  sessionStorage.removeItem('problemListQuery');
                  router.push(`/problems?${queryParams}`);
                } else {
                  router.push('/');
                }
              }}
              style={{ marginBottom: '1rem' }}
            >
              <Icon name="arrow left" />
              返回题目列表
            </Button>
            {isAuthenticated && (
              <Button
                color="red"
                onClick={() => setDeleteModalOpen(true)}
                style={{ marginBottom: '1rem', marginLeft: '0.5rem' }}
              >
                <Icon name="trash" />
                删除题目
              </Button>
            )}
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width="16">
            <Header as="h2" dividing>
              题目详情
              {problem.collections && problem.collections.length > 0 && (
                <Header.Subheader>
                  所属习题集：
                  {problem.collections.map((col, idx) => (
                    <span key={col.id}>
                      <a href={`/collection/${col.id}`} style={{ color: '#667eea' }}>
                        {col.name}
                      </a>
                      {idx < problem.collections!.length - 1 && ', '}
                    </span>
                  ))}
                </Header.Subheader>
              )}
            </Header>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width="16">
            <Segment>
              <Header as="h3">
                <Icon name="question circle" />
                题面
              </Header>
              <div style={{ padding: '1rem', fontSize: '1.1rem' }}>
                <MarkdownRenderer content={problem.statement} />
              </div>
            </Segment>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width="16">
            <Accordion>
              <Accordion.Title
                active={solutionVisible}
                onClick={() => setSolutionVisible(!solutionVisible)}
              >
                <Icon name="dropdown" />
                {solutionVisible ? '隐藏答案' : '显示答案'}
              </Accordion.Title>
              <Accordion.Content active={solutionVisible}>
                <Segment>
                  <Header as="h3">
                    <Icon name="lightbulb" />
                    答案与解析
                  </Header>
                  <div style={{ padding: '1rem', fontSize: '1.1rem' }}>
                    <MarkdownRenderer content={problem.solution} />
                  </div>
                </Segment>
              </Accordion.Content>
            </Accordion>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width="16">
            <ChatInterface problemId={problemId} />
          </Grid.Column>
        </Grid.Row>

        {problem.origin && (
          <Grid.Row>
            <Grid.Column width="16">
              <Message info>
                <Message.Header>题目来源</Message.Header>
                <p>{problem.origin}</p>
              </Message>
            </Grid.Column>
          </Grid.Row>
        )}
      </Grid>

      {/* 删除确认对话框 */}
      <Modal
        open={deleteModalOpen}
        onClose={() => !deleteLoading && setDeleteModalOpen(false)}
        size="small"
      >
        <Modal.Header>
          <Icon name="warning sign" color="red" />
          确认删除题目
        </Modal.Header>
        <Modal.Content>
          <p>您确定要删除这道题目吗？</p>
          <p>此操作将同时从所有习题集中移除该题目，且<strong>不可撤销</strong>。</p>
          {problem?.collections && problem.collections.length > 0 && (
            <Message warning style={{ marginTop: '1rem' }}>
              <Message.Header>注意</Message.Header>
              <p>该题目目前存在于以下习题集中：</p>
              <ul>
                {problem.collections.map(col => (
                  <li key={col.id}>{col.name}</li>
                ))}
              </ul>
              <p>删除后将从这些习题集中移除。</p>
            </Message>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteLoading}
          >
            取消
          </Button>
          <Button
            color="red"
            loading={deleteLoading}
            onClick={handleDelete}
          >
            <Icon name="trash" />
            确认删除
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
}