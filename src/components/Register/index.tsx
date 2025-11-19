import {
  Anchor,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Alert,
} from "@mantine/core";
import { upperFirst } from "@mantine/hooks";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { authClient } from "@/lib/client/auth";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

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

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password: password,
        name: name.trim(),
      });

      if (result.error) {
        setError(result.error.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      if (result.data) {
        setSuccess("Registration successful! Redirecting to sign in...");
        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setTermsAccepted(false);
        
        // Sign out to ensure user must explicitly sign in
        // (better-auth may auto-sign-in after registration)
        await authClient.signOut();
        
        // Redirect to sign-in page after 2 seconds
        setTimeout(() => {
          navigate("/sign-in");
        }, 2000);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={400}>
      <Paper radius="md" p="lg" withBorder>
        <Text size="lg" fw={500}>
          Welcome
        </Text>
        <form onSubmit={handleSubmit}>
          <Stack mt="md">
            {error && (
              <Alert color="red" title="Error" onClose={() => setError("")} withCloseButton>
                {error}
              </Alert>
            )}
            {success && (
              <Alert color="green" title="Success" onClose={() => setSuccess("")} withCloseButton>
                {success}
              </Alert>
            )}
            <TextInput
              label="Name"
              placeholder="Your name"
              radius="md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
            <TextInput
              required
              label="Email"
              placeholder="hello@example.com"
              radius="md"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              radius="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Checkbox
              label="I accept terms and conditions"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.currentTarget.checked)}
              disabled={loading}
            />
          </Stack>
          <Group justify="space-between" mt="xl">
            <Anchor component={Link} type="button" c="dimmed" size="xs" to={"/sign-in"}>
              Already have an account? Sign In
            </Anchor>
            <Button type="submit" radius="xl" loading={loading} disabled={loading}>
              {upperFirst("Register")}
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
