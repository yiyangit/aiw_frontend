'use client';

import { useEffect, useState } from 'react';
import { Container, Header, Segment, Button, Icon } from 'semantic-ui-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryTree } from '@/lib/api';
import { Category } from '@/types';

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [calculusId, setCalculusId] = useState<string>('');
  const [linearAlgebraId, setLinearAlgebraId] = useState<string>('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategoryTree();
      setCategories(data || []);

      // 查找"高等数学"分类ID
      const calculus = findCategoryByName(data, '高等数学');
      if (calculus) setCalculusId(calculus.id);

      // 查找"线性代数"分类ID
      const linearAlgebra = findCategoryByName(data, '线性代数');
      if (linearAlgebra) setLinearAlgebraId(linearAlgebra.id);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const findCategoryByName = (categories: Category[], name: string): Category | null => {
    for (const category of categories) {
      if (category.name === name) {
        return category;
      }
      if (category.children) {
        const found = findCategoryByName(category.children, name);
        if (found) return found;
      }
    }
    return null;
  };

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
                更多功能敬请期待喵！
              </Header.Subheader>
            </Header.Content>
          </Header>

          <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              primary
              size="huge"
              onClick={() => calculusId && router.push(`/collections?category_id=${calculusId}`)}
              disabled={!calculusId}
              style={{
                background: calculusId ? 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                border: 'none',
                padding: '1.5rem 3rem',
                fontSize: '1.2rem',
                boxShadow: calculusId ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
                minWidth: '200px',
                cursor: calculusId ? 'pointer' : 'not-allowed'
              }}
            >
              <Icon name="calculator" />
              高等数学
            </Button>
            <Button
              primary
              size="huge"
              onClick={() => linearAlgebraId && router.push(`/collections?category_id=${linearAlgebraId}`)}
              disabled={!linearAlgebraId}
              style={{
                background: linearAlgebraId ? 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)' : '#ccc',
                border: 'none',
                padding: '1.5rem 3rem',
                fontSize: '1.2rem',
                boxShadow: linearAlgebraId ? '0 4px 15px rgba(245, 87, 108, 0.4)' : 'none',
                minWidth: '200px',
                cursor: linearAlgebraId ? 'pointer' : 'not-allowed'
              }}
            >
              <Icon name="grid layout" />
              线性代数
            </Button>
          </div>
        </Segment>
      </Container>
    </>
  );
}
