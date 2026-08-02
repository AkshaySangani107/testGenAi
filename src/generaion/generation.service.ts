import { GoogleGenAI } from "@google/genai";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ParsedClass, parseTypeScriptFile } from "src/parser/typescript.parser";
import { EmbeddingService } from "src/rag/embedding.service";
import { KnowledgeBase } from "src/rag/entities/knowledge-base.entity";
import { Repository } from "typeorm";

@Injectable()
export class TestGenerationService {
    private readonly logger = new Logger(TestGenerationService.name)
    private genAI: GoogleGenAI

    constructor(
        @InjectRepository(KnowledgeBase)
        private readonly knowledgeRepo: Repository<KnowledgeBase>,
        @Inject(EmbeddingService) private readonly embeddingService: EmbeddingService
    ) {
        this.genAI = new GoogleGenAI({ apiKey: String(process.env.GEMINI_API_KEY) })
    }

    async generateTests(fileContent: string): Promise<string> {
        // Step 1: parse the file
        const parsedFile = parseTypeScriptFile(fileContent)
        console.log("Parsed File", parsedFile);

        // Step 2: build search query from parsed result
        const searchQuery = `NestJS ${parsedFile.className} service 
  with methods: ${parsedFile.methods.map(m => m.name).join(', ')}
  dependencies: ${parsedFile.injectedDependencies.join(', ')}`
        console.log("Search Query", searchQuery);

        // Step 3: search RAG for relevant patterns
        const ragResults = await this.embeddingService.searchSimilar(searchQuery, 'typescript', 5)
        console.log("RAG Results", ragResults);

        // Step 4: build the prompt (replace {parsedClass} and {ragContext})
        const prompt = this.buildPrompt(parsedFile, ragResults);
        console.log(prompt)
        // Step 5: call Gemini LLM
        const result = await this.genAI.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: "hello"
        })
        // Step 6: return generated test code as string
        return result.text || "";
    }


    private buildPrompt(
        parsedClass: ParsedClass,
        ragContext: { content: string; title: string; tags: string[]; category: string; similarity: number }[]
    ): string {

        return `
You are a Senior Software Engineer with 10+ years of experience in NestJS, TypeScript, Jest, and backend architecture. You specialize in writing clean, maintainable, production-grade unit tests.

You are given:

Parsed NestJS class:
${JSON.stringify(parsedClass, null, 2)}

Relevant testing patterns retrieved from the knowledge base:
${ragContext.map(r =>
            `Title: ${r.title}
Content: ${r.content}
Tags: ${r.tags.join(', ')}
Similarity: ${(r.similarity * 100).toFixed(1)}%`
        )}

Your task:
Generate a complete Jest unit test file for the provided class.

Rules:

1. Test Structure
- Follow Arrange → Act → Assert.
- Group tests using describe() and it().
- Use meaningful, descriptive test names.
- Create one test for every public method.
- Add multiple test cases when methods have different execution paths.

2. Mocking Rules
- Mock every external dependency.
- Mock repositories, services, HTTP clients, queues, event emitters, caches, and third-party SDKs.
- Never call real databases, APIs, Redis, RabbitMQ, or external services.
- Use jest.fn() or jest.spyOn() where appropriate.
- Reset mocks before each test.

3. Coverage Rules
Generate tests for:
- Successful execution
- Validation failures
- Expected exceptions
- Unexpected exceptions
- Null or undefined inputs
- Empty arrays or objects
- Boundary conditions
- Conditional branches
- Async success
- Async rejection
- Promise-based methods
- Boolean return paths

Aim for near 100% branch and statement coverage whenever practical.

4. Assertions
- Verify returned values.
- Verify dependency method calls.
- Verify call count.
- Verify call arguments.
- Verify thrown exceptions using rejects.toThrow() or toThrow().
- Verify methods that should not be called.

5. NestJS Best Practices
- Use Test.createTestingModule().
- Properly provide mocked providers.
- Retrieve instances using module.get().
- Keep tests isolated.
- Avoid shared mutable state.
- Prefer strongly typed mocks.

6. Code Quality
- Produce readable, maintainable code.
- Remove duplicate setup.
- Use beforeEach().
- Use constants where appropriate.
- Keep formatting consistent.
- Do not generate commented-out code.

7. Dependency Handling
If constructor dependencies exist:
- Mock every dependency.
- Infer mock methods from the parsed class.
- Include only methods actually used.
- Provide sensible default mock implementations.

8. Edge Cases
Generate tests for:
- Missing required parameters
- Invalid values
- Empty collections
- Duplicate values (if applicable)
- Repository returning null
- Repository throwing errors
- Dependency failures
- Timeouts if relevant
- Business rule violations

9. Output Constraints
Return ONLY valid TypeScript code.
Do NOT use Markdown.
Do NOT wrap the output in triple backticks.
Do NOT include explanations.
Do NOT include notes before or after the code.
Do NOT generate placeholder comments like "Add more tests here".
The output must be directly writable to a '.spec.ts' file.

10. Imports
Generate every required import.
Import the class under test.
Import NestJS testing utilities.
Import Jest utilities when necessary.
Do not generate unused imports.

11. Determinism
Do not invent APIs that do not exist.
Only use methods, properties, and dependencies present in the parsed class or retrieved testing patterns.
If information is missing, make the safest reasonable assumption while keeping the generated code syntactically valid.

Output:
Return a single complete Jest unit test file that is ready to save as < class- name >.spec.ts
`
    }
}