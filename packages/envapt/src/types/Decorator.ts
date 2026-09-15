// a field narrower than Output fails to compile. the [Output] tuple stops a union Output from distributing.
export type EnvaptFieldDecorator<Output> = <Target, Key extends keyof Target>(
    target: Target,
    key: [Output] extends [Target[Key]] ? Key : { '[envapt] field type must hold the converter output': Output }
) => void;

// same check as EnvaptFieldDecorator, on the accessor type
export type EnvaptAccessorDecorator<Output> = <This, Value>(
    target: ClassAccessorDecoratorTarget<
        This,
        [Output] extends [Value] ? Value : { '[envapt] field type must hold the converter output': Output }
    >,
    context: ClassAccessorDecoratorContext<
        This,
        [Output] extends [Value] ? Value : { '[envapt] field type must hold the converter output': Output }
    >
) => ClassAccessorDecoratorResult<This, Value>;
