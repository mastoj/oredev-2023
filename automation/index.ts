import { CreateArgs, destroy, list, up } from "./program";
import fastify from "fastify";
const app = fastify();

app.post("/", async (request, reply) => {
  const args = request.body as CreateArgs;
  const outputs = await up(args);
  reply.send({ result: "ok", outputs });
});
app.get("/", async (request, reply) => {
  const result = await list();
  reply.send({ result: "ok", stacks: result });
});
app.delete("/:stackName", async (request, reply) => {
  const stackName = (request.params as any).stackName;
  const message = await destroy({ stackName });
  reply.send({ result: "ok", message });
});

app
  .listen({
    port: 3000,
  })
  .then(() => {
    console.log(`Server running at http://localhost:3000/`);
  });
