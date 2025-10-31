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
} from "@mantine/core";
import { upperFirst } from "@mantine/hooks";
import { Link } from "react-router";

const Register = () =>{
  return (
    <Container size={400}>
      <Paper radius="md" p="lg" withBorder>
        <Text size="lg" fw={500}>
          Welcome
        </Text>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Stack>
            <TextInput label="Name" placeholder="Your name" radius="md" />
            <TextInput
              required
              label="Email"
              placeholder="hello@mantine.dev"
              radius="md"
            />
            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              radius="md"
            />
            <Checkbox label="I accept terms and conditions" />
          </Stack>
          <Group justify="space-between" mt="xl">
            <Anchor component={Link} type="button" c="dimmed" size="xs" to={'/sign-in'}>
              Already have an account? Sign In
            </Anchor>
            <Button type="submit" radius="xl">
              {upperFirst("Register")}
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default Register
