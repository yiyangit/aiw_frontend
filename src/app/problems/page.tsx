'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Grid, Header, Button, Segment, Loader, Message, Divider } from 'semantic-ui-react';
import { Problem } from '@/types';
import { getProblems, getProblem } from '@/lib/api';
import { useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';

function ProblemsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectName = searchParams.get('subject');
  const chapterNum = searchParams.get('chapter');
  const sectionNum = searchParams.get('section');

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (subjectName) {
      loadProblems();
    } else {
      setError('缺少科目参数');
      setLoading(false);
    }
  }, [subjectName, chapterNum, sectionNum]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const result = await getProblems(subjectName!, chapterNum || undefined, sectionNum || undefined);

      // 获取每个题目的详细信息
      const problemDetails = await Promise.all(
        result.problems.map(async (id) => {
          return await getProblem(id);
        })
      );

      setProblems(problemDetails);
    } catch (err) {
      setError('加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProblemClick = (problemId: string) => {
    // 保存当前查询参数到sessionStorage，以便返回时使用
    const currentQuery = searchParams.toString();
    sessionStorage.setItem('problemListQuery', currentQuery);
    router.push(`/problem/${problemId}`);
  };

  const handleBack = () => {
    // 清理保存的查询参数
    sessionStorage.removeItem('problemListQuery');
    router.push('/');
  };

  if (loading) {
    return (
      <Container style={{ padding: '2rem 0' }}>
        <Segment textAlign="center">
          <Loader active size="large">
            加载题目列表中...
          </Loader>
        </Segment>
      </Container>
    );
  }

  if (error) {
    return (
      <Container style={{ padding: '2rem 0' }}>
        <Message negative>
          <Message.Header>加载失败</Message.Header>
          <p>{error}</p>
          <Button onClick={handleBack}>返回首页</Button>
        </Message>
      </Container>
    );
  }

  return (
    <Container style={{ padding: '2rem 0' }}>
      <Grid stackable>
        <Grid.Row>
          <Grid.Column width="16">
            <Button basic onClick={handleBack} style={{ marginBottom: '1rem' }}>
              ← 返回首页
            </Button>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width="16">
            <Header as="h2">
              题目列表
              <Header.Subheader>
                共找到 {problems.length} 道题目
                {chapterNum && ` (第${chapterNum}章)`}
                {sectionNum && ` (第${sectionNum}节)`}
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
                  没有找到题目
                </Header>
                <p>该条件下暂无题目，请尝试其他选择。</p>
                <Button primary onClick={handleBack}>
                  重新选择
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
                        <span style={{ fontSize: '0.9em', color: '#666', float: 'right' }}>
                          难度: {problem.difficulty}/10
                        </span>
                      </div>

                      <div style={{
                        maxHeight: '150px',
                        overflow: 'hidden',
                        marginBottom: '0.8rem',
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

                      <div style={{ fontSize: '0.85em', color: '#888' }}>
                        <span>科目: {problem.subject}</span>
                        {problem.section && (
                          <span style={{ marginLeft: '1rem' }}>
                            章节: {problem.section}
                          </span>
                        )}
                        {problem.origin && (
                          <span style={{ marginLeft: '1rem' }}>
                            来源: {problem.origin}
                          </span>
                        )}
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
  );
}

function ProblemsPageLoadingFallback() {
  return (
    <Container style={{ padding: '2rem 0' }}>
      <Segment textAlign="center">
        <Loader active size="large">
          加载中...
        </Loader>
      </Segment>
    </Container>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<ProblemsPageLoadingFallback />}>
      <ProblemsPageContent />
    </Suspense>
  );
}