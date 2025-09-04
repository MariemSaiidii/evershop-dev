pipeline {
    agent {
        kubernetes {
            // Define the Jenkins agent pod (with Docker-in-Docker enabled)
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: docker
      image: docker:24.0.7-dind   # Docker-in-Docker image
      command:
      - cat
      tty: true
      securityContext:
        privileged: true
"""
        }
    }

    environment {
        // Load secrets from Jenkins credentials
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        GITHUB_CREDENTIALS = credentials('github-creds')

        // Your DockerHub repo (change if needed)
        DOCKERHUB_REPO = "mariem631/evershop"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git(credentialsId: 'github-creds', url: 'https://github.com/MariemSaiidii/evershop-dev.git', branch: 'main')
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                container('docker') {
                    sh """
                    echo "🔑 Logging into DockerHub..."
                    echo "${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "${DOCKERHUB_CREDENTIALS_USR}" --password-stdin

                    echo "📦 Building Docker image..."
                    docker build -t $DOCKERHUB_REPO:latest .

                    echo "🚀 Pushing Docker image..."
                    docker push $DOCKERHUB_REPO:latest
                    """
                }
            }
        }

        stage('Update Helm Values') {
            steps {
                sh """
                echo "📝 Updating helm/values.yaml with new Docker image..."

                # Replace the image tag in helm/values.yaml
                sed -i 's|repository: .*|repository: $DOCKERHUB_REPO|' helm/values.yaml
                sed -i 's|tag: .*|tag: latest|' helm/values.yaml

                # Git commit & push
                git config --global user.email "ci@jenkins"
                git config --global user.name "Jenkins CI"
                git add helm/values.yaml
                git commit -m "Update image to latest"
                git push https://${GITHUB_CREDENTIALS_USR}:${GITHUB_CREDENTIALS_PSW}@github.com/MariemSaiidii/evershop-dev.git main
                """
            }
        }
    }
}
