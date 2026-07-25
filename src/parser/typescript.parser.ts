import { Project, SourceFile, ClassDeclaration } from 'ts-morph'

export interface ParsedMethod {
    name: string
    parameters: { name: string; type: string }[]
    returnType: string
    isAsync: boolean
    decorators: string[]
}

export interface ParsedClass {
    className: string
    methods: ParsedMethod[]
    injectedDependencies: string[]
}

export function parseTypeScriptFile(fileContent: string): ParsedClass {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile: SourceFile = project.createSourceFile(
        'temp.ts',
        fileContent
    )

    const classes = sourceFile.getClasses()
    if (classes.length === 0) {
        throw new Error('No class found in file')
    }

    const cls: ClassDeclaration = classes[0]

    const constructor = cls.getConstructors()[0]
    const injectedDependencies = constructor
        ? constructor.getParameters().map(p => p.getType().getText())
        : []

    const methods: ParsedMethod[] = cls.getMethods().map(method => ({
        name: method.getName(),
        parameters: method.getParameters().map(p => ({
            name: p.getName(),
            type: p.getType().getText()
        })),
        returnType: method.getReturnType().getText(),
        isAsync: method.isAsync(),
        decorators: method.getDecorators().map(d => d.getName()),
    }))

    return {
        className: cls.getName() || 'UnknownClass',
        methods,
        injectedDependencies
    }
}