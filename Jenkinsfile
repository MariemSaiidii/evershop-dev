pipeline {
    agent {
        kubernetes {
            cloud 'minikube-cloud'
            defaultContainer 'jnlp'
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: jnlp
    image: jenkins/inbound-agent:latest
    tty: true
  - name: docker
    image: docker:24.0.7
    command:
    - cat
    tty: true
    volumeMounts:
      - name: docker-sock
        mountPath: /var/run/docker.sock
    env:
      - name: DOCKER_HOST
        value: unix:///var/run/docker.sock
  - name: git
    image: alpine/git:latest
    command:
    - cat
    tty: true
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
"""
        }
    }

    environment {
        DOCKER_IMAGE = "mariem631/evershop"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/MariemSaiidii/evershop-dev.git'
            }
        }

        stage('Build & Push Docker image') {
            steps {
                container('docker') {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
echo "Logging into DockerHub..."
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

echo "Building image..."
docker build -t $DOCKER_IMAGE:$IMAGE_TAG ./evershop

echo "Pushing image..."
docker push $DOCKER_IMAGE:$IMAGE_TAG

# Optional: push latest tag
docker tag $DOCKER_IMAGE:$IMAGE_TAG $DOCKER_IMAGE:latest
docker push $DOCKER_IMAGE:latest
'''
                    }
                }
            }
        }

        stage('Update Helm values.yaml and push') {
            steps {
                container('git') {
                    withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                        sh '''
set -e

git config user.email "ci@jenkins"
git config user.name "Jenkins CI"

sed -i 's|repository: .*|repository: '"$DOCKER_IMAGE"'|' helm/values.yaml
sed -i 's|tag: .*|tag: '"$IMAGE_TAG"'|' helm/values.yaml

git add helm/values.yaml
git commit -m "ci: update image to $DOCKER_IMAGE:$IMAGE_TAG" || echo "No changes to commit"

git remote set-url origin https://$GIT_USER:$GIT_PASS@github.com/MariemSaiidii/evershop-dev.git
git push origin main
'''
                    }
                }
            }
        }
    }
}
