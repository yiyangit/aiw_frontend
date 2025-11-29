'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Menu, Button, Dropdown, Icon } from 'semantic-ui-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const userMenuOptions = [
    {
      key: 'profile',
      text: (
        <span>
          <Icon name='user' />
          个人资料
        </span>
      ),
      value: 'profile',
    },
    {
      key: 'logout',
      text: (
        <span>
          <Icon name='sign out' />
          登出
        </span>
      ),
      value: 'logout',
    },
  ];

  const handleUserMenuSelect = (e: any, data: any) => {
    if (data.value === 'logout') {
      handleLogout();
    } else if (data.value === 'profile') {
      // 可以跳转到个人资料页面
      alert('个人资料页面待开发');
    }
  };

  return (
    <Menu fixed="top" inverted>
      <Container>
        <Link href="/" passHref legacyBehavior>
          <Menu.Item header as="a">
            <Icon name="graduation cap" />
            Aihara Workbooks
          </Menu.Item>
        </Link>

        <Menu.Menu position="right">
          {isAuthenticated ? (
            <>
              <Link href="/admin" passHref legacyBehavior>
                <Menu.Item as="a">
                  <Icon name="settings" />
                  管理后台
                </Menu.Item>
              </Link>
              <Dropdown
                item
                text={user?.username || '用户'}
                icon="user"
              >
                <Dropdown.Menu>
                  {userMenuOptions.map((option) => (
                    <Dropdown.Item
                      key={option.key}
                      text={option.text}
                      value={option.value}
                      onClick={handleUserMenuSelect}
                    />
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </>
          ) : (
            <>
              <Link href="/login" passHref legacyBehavior>
                <Menu.Item as="a">
                  登录
                </Menu.Item>
              </Link>
            </>
          )}
        </Menu.Menu>
      </Container>
    </Menu>
  );
}
