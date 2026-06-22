import React from "react";

export interface TechIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const baseProps = (size = 16, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  className,
});

function createSvg(
  children: React.ReactNode,
  size = 16,
  className?: string
): React.ReactElement {
  return React.createElement("svg", baseProps(size, className), children);
}

const NextJsIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.998V9.251l5.387 7.548 1.277 1.789V7.2h1.8v14.778h.003z" })
    ),
    size, className
  );

const ReactIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("circle", { cx: "12", cy: "12", r: "2.5", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }),
      React.createElement("ellipse", { cx: "12", cy: "12", rx: "10", ry: "3.5", fill: "none", stroke: "currentColor", strokeWidth: "1" }),
      React.createElement("ellipse", { cx: "12", cy: "12", rx: "3.5", ry: "10", fill: "none", stroke: "currentColor", strokeWidth: "1" }),
      React.createElement("ellipse", { cx: "12", cy: "12", rx: "7.5", ry: "9", fill: "none", stroke: "currentColor", strokeWidth: "1", transform: "rotate(45 12 12)" }),
      React.createElement("ellipse", { cx: "12", cy: "12", rx: "7.5", ry: "9", fill: "none", stroke: "currentColor", strokeWidth: "1", transform: "rotate(-45 12 12)" })
    ),
    size, className
  );

const NodeJsIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15.5c0 .276-.224.5-.5.5H8.5c-.276 0-.5-.224-.5-.5v-11c0-.276.224-.5.5-.5h2c.276 0 .5.224.5.5v11zm5 0c0 .276-.224.5-.5.5h-2c-.276 0-.5-.224-.5-.5v-7c0-.276.224-.5.5-.5h2c.276 0 .5.224.5.5v7z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const TypeScriptIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "3", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }),
      React.createElement("path", { d: "M7 7h3v2H9v6H7V9H5V7h2zm8.5 0c.8 0 1.5.3 2 .9.3.3.5.7.5 1.1H16c0-.3-.2-.5-.5-.5s-.5.2-.5.5c0 .2.2.4.6.6l.8.3c1 .4 1.5 1 1.5 1.8 0 1-.8 1.8-2 1.8-.9 0-1.6-.4-2-1h1.2c.2.4.5.6 1 .6s.7-.3.7-.7c0-.3-.2-.5-.7-.7l-.8-.3c-.8-.3-1.3-.9-1.3-1.7 0-.9.7-1.6 1.9-1.6z" })
    ),
    size, className
  );

const PythonIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5c0 .28-.22.5-.5.5H8.5c-.28 0-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5h2c.28 0 .5.22.5.5v1zm5 0c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5v-4c0-.28.22-.5.5-.5h2c.28 0 .5.22.5.5v4zm-5-6c0 .28-.22.5-.5.5H8.5c-.28 0-.5-.22-.5-.5v-4c0-.28.22-.5.5-.5h2c.28 0 .5.22.5.5v4z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const FlaskIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2L4 20h16L12 2zm0 4l5 12H7l5-12z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" })
    ),
    size, className
  );

const PostgreSQLIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3 13.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-7c0-.828.672-1.5 1.5-1.5h3c.828 0 1.5.672 1.5 1.5v7z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const MongoDBIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v9zm6 0c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-5c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v5z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const RedisIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.5c0 .83-.67 1.5-1.5 1.5h-7c-.83 0-1.5-.67-1.5-1.5v-1c0-.83.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5v1z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const DockerIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5 11h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H7v-2h2v2zm0-4H7V7h2v2zm4 0h-2V7h2v2zm-8 4H3v-2h2v2z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const KubernetesIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2L2 7v10l10 5 10-5V7l-10-5zm0 3l6 3v6l-6 3-6-3V8l6-3z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }),
      React.createElement("circle", { cx: "12", cy: "12", r: "3", fill: "none", stroke: "currentColor", strokeWidth: "1" })
    ),
    size, className
  );

const AWSSIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 14.5c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5v-9c0-.83.67-1.5 1.5-1.5h3c.83 0 1.5.67 1.5 1.5v9z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const GoIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-3 7c0-.552.448-1 1-1h4c.552 0 1 .448 1 1v1h-6V9zm8 4H7v-1h10v1z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const RustIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-2-2 2-2m4 0l2 2-2 2m-3-8l-2 6", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
    ),
    size, className
  );

const JavaIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v8zm6-4c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v4z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const ExpressIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM7 8h10v2H9v2h6v2H9v2h8v2H7V8z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const NestJsIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-3-3 3-3m2 0l3 3-3 3", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
    ),
    size, className
  );

const FastAPIIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2L2 7v10l10 5 10-5V7l-10-5zm0 3l6 3v6l-6 3-6-3V8l6-3z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }),
      React.createElement("path", { d: "M10 9l4 3-4 3", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
    ),
    size, className
  );

const DjangoIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 7h2v7c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-1h2v1h1V7zm6 0h2v7c0 1.1-.9 2-2 2h-1c-1.1 0-2-.9-2-2v-1h2v1h1V7z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const AngularIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2L3 6v11l9 5 9-5V6l-9-4zm0 3l5 2.5v5L12 18l-5-5.5v-5L12 5z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" })
    ),
    size, className
  );

const VueIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2L2 20h4l6-11 6 11h4L12 2z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" })
    ),
    size, className
  );

const SvelteIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2L3 20h18L12 2zm0 4l5 10H7l5-10z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" })
    ),
    size, className
  );

const GitHubIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const TerraformIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2L3 7v10l9 5 9-5V7l-9-5zm0 3l5 3v6l-5 3-5-3V8l5-3z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" })
    ),
    size, className
  );

const KafkaIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v8zm6 0c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v4z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const RabbitMQIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v3zm6-2c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v4z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const SQLiteIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-5c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v5zm6-2c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v5z", fill: "none", stroke: "currentColor", strokeWidth: "1.5" })
    ),
    size, className
  );

const DefaultServiceIcon = ({ size, className }: TechIconProps) =>
  createSvg(
    React.createElement(React.Fragment, null,
      React.createElement("circle", { cx: "12", cy: "12", r: "10", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }),
      React.createElement("path", { d: "M12 8v8M8 12h8", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
    ),
    size, className
  );

export const TECH_ICONS: Record<string, React.ComponentType<TechIconProps>> = {
  "Next.js": NextJsIcon,
  "next": NextJsIcon,
  "React": ReactIcon,
  "react": ReactIcon,
  "Node.js": NodeJsIcon,
  "node": NodeJsIcon,
  "TypeScript": TypeScriptIcon,
  "typescript": TypeScriptIcon,
  "ts": TypeScriptIcon,
  "Python": PythonIcon,
  "python": PythonIcon,
  "py": PythonIcon,
  "Flask": FlaskIcon,
  "flask": FlaskIcon,
  "PostgreSQL": PostgreSQLIcon,
  "postgres": PostgreSQLIcon,
  "postgresql": PostgreSQLIcon,
  "pg": PostgreSQLIcon,
  "MongoDB": MongoDBIcon,
  "mongodb": MongoDBIcon,
  "mongo": MongoDBIcon,
  "Redis": RedisIcon,
  "redis": RedisIcon,
  "Docker": DockerIcon,
  "docker": DockerIcon,
  "Kubernetes": KubernetesIcon,
  "kubernetes": KubernetesIcon,
  "k8s": KubernetesIcon,
  "AWS": AWSSIcon,
  "aws": AWSSIcon,
  "Go": GoIcon,
  "go": GoIcon,
  "golang": GoIcon,
  "Rust": RustIcon,
  "rust": RustIcon,
  "Java": JavaIcon,
  "java": JavaIcon,
  "Express": ExpressIcon,
  "express": ExpressIcon,
  "NestJS": NestJsIcon,
  "nestjs": NestJsIcon,
  "nest": NestJsIcon,
  "FastAPI": FastAPIIcon,
  "fastapi": FastAPIIcon,
  "Django": DjangoIcon,
  "django": DjangoIcon,
  "Angular": AngularIcon,
  "angular": AngularIcon,
  "Vue": VueIcon,
  "vue": VueIcon,
  "Svelte": SvelteIcon,
  "svelte": SvelteIcon,
  "GitHub": GitHubIcon,
  "github": GitHubIcon,
  "Terraform": TerraformIcon,
  "terraform": TerraformIcon,
  "Kafka": KafkaIcon,
  "kafka": KafkaIcon,
  "RabbitMQ": RabbitMQIcon,
  "rabbitmq": RabbitMQIcon,
  "SQLite": SQLiteIcon,
  "sqlite": SQLiteIcon,
  "sqlite3": SQLiteIcon,
};

export function getTechIcon(technology: string): React.ComponentType<TechIconProps> {
  return TECH_ICONS[technology] || DefaultServiceIcon;
}

export const NODE_TYPE_ICON_MAP: Record<string, React.ComponentType<TechIconProps>> = {
  frontend: ReactIcon,
  backend: NodeJsIcon,
  database: PostgreSQLIcon,
  infrastructure: DockerIcon,
  service: DefaultServiceIcon,
  library: DefaultServiceIcon,
  queue: RabbitMQIcon,
  worker: DefaultServiceIcon,
};
