import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title, Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';
import { identifyUser, trackAppOpened } from '../lib/analytics';

const RegisterPage = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authService.register(email, password, name);
      dispatch(setCredentials(res));
      identifyUser(res.user.id, res.user.email, res.user.name);
      trackAppOpened();
      queryClient.removeQueries({ queryKey: ['dashboard'] });
      queryClient.removeQueries({ queryKey: ['today'] });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center
      h="100vh"
      style={{
        background:
          'radial-gradient(ellipse 120% 84% at 50% -10%, rgba(142, 112, 255, 0.14) 0%, transparent 55%), linear-gradient(165deg, #faf8ff 0%, var(--shell-bg) 45%, #ede9fe 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <Box px="lg">
          <Stack mb="xl" align="center">
            <Title order={1} fw={800} style={{ letterSpacing: -1, color: 'var(--accent)' }}>PLOS</Title>
            <Text size="sm" style={{ color: 'var(--text-secondary)' }}>Start managing your life better</Text>
          </Stack>

          <Paper
            p="xl"
            radius="xl"
            shadow="md"
            withBorder
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              boxShadow: 'var(--pl-shadow-card)',
            }}
          >
            <Title order={3} mb="lg" style={{ color: 'var(--text-primary)' }}>Create your account</Title>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" radius="md">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack>
                <TextInput
                  label="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="md"
                  placeholder="Rohan"
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="md"
                />
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  size="md"
                />
                <Button type="submit" loading={loading} size="md" color="violet" mt="xs">
                  Get started — it's free
                </Button>
              </Stack>
            </form>

            <Text size="sm" mt="lg" ta="center" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Text component={Link} to="/login" c="violet.8" inherit fw={600}>
                Sign in
              </Text>
            </Text>
          </Paper>
        </Box>
      </motion.div>
    </Center>
  );
};

export default RegisterPage;
