import {
  Anchor,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Alert,
  Stack,
} from "@mantine/core";
import classes from "./index.module.css";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { authClient } from "@/lib/client/auth";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      if (result.data) {
        // Session is automatically managed by better-auth
        // Redirect to home page on successful sign in
        navigate("/");
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        Welcome back!
      </Title>

      <Text className={classes.subtitle}>
        Do not have an account yet?{" "}
        <Anchor component={Link} to={"/register"}>
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <Alert color="red" title="Error" onClose={() => setError("")} withCloseButton>
                {error}
              </Alert>
            )}
            <TextInput
              label="Email"
              placeholder="you@example.dev"
              required
              radius="md"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              radius="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Group justify="space-between" mt="lg">
              <Checkbox 
                label="Remember me" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.currentTarget.checked)}
                disabled={loading}
              />
              <Anchor component={Link} size="sm" type="button" to={'/forgot-password'}>
                Forgot password?
              </Anchor>
            </Group>
            <Button 
              fullWidth 
              mt="xl" 
              radius="md" 
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default SignIn;
