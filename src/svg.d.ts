declare module '!!@svgr/webpack!*.svg' {
    const svg: React.ElementType;
    export default svg;
}

declare module '*.svg' {
    const url: string;
    export default url;
}
